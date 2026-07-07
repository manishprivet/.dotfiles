function wt-cleanup --description 'Interactively clean up Worktrunk worktrees'
    argparse -n wt-cleanup 'h/help' 'a/all' 'y/yes' 'f/force' 'D/force-delete' -- $argv
    or return

    if set -q _flag_help
        printf '%s\n' \
            'Usage: wt-cleanup [OPTIONS]' \
            '' \
            'Interactively remove Worktrunk worktrees in the current repo.' \
            '' \
            'Options:' \
            '  -a, --all           Include every non-main, non-current worktree' \
            '  -y, --yes           Skip the final confirmation prompt' \
            '  -f, --force         Pass --force to wt remove for untracked files' \
            '  -D, --force-delete  Pass --force-delete to wt remove for unmerged branches' \
            '  -h, --help          Show this help' \
            '' \
            'By default, candidates are clean, non-current worktrees whose branch' \
            'is empty, at the same commit as main, or integrated into main.' \
            'PR status is shown from gh pr list when available.'
        return 0
    end

    if not command -q wt
        printf '%s\n' 'wt-cleanup: wt is not installed or not on PATH' >&2
        return 127
    end

    if not command -q jq
        printf '%s\n' 'wt-cleanup: jq is required to read wt list --format=json' >&2
        return 127
    end

    set -l jq_filter '.[] | select(.kind == "worktree" and (.is_main | not) and (.is_current | not) and ((.worktree.state? // "") != "locked")) | [.branch, .main_state, (.symbols // ""), .path] | @tsv'

    if not set -q _flag_all
        set jq_filter '.[] | select(.kind == "worktree" and (.is_main | not) and (.is_current | not) and ((.worktree.state? // "") != "locked") and ((.main_state == "empty") or (.main_state == "same_commit") or (.main_state == "integrated")) and ((.working_tree.staged // false | not) and (.working_tree.modified // false | not) and (.working_tree.untracked // false | not) and (.working_tree.renamed // false | not) and (.working_tree.deleted // false | not))) | [.branch, .main_state, (.symbols // ""), .path] | @tsv'
    end

    set -l candidates (wt list --format=json | jq -r $jq_filter)
    set -l wt_status $pipestatus[1]
    set -l jq_status $pipestatus[2]
    test $wt_status -eq 0; or return $wt_status
    test $jq_status -eq 0; or return $jq_status

    if test (count $candidates) -eq 0
        printf '%s\n' 'No cleanup candidates found.'
        return 0
    end

    set -l pr_lookup unavailable
    if command -q gh
        set pr_lookup ok
    end

    set -l enriched_candidates
    test $pr_lookup = ok; and printf '%s\n' 'Looking up PR status with gh...' >&2
    for line in $candidates
        set -l fields (string split \t $line)
        set -l branch $fields[1]
        set -l main_state $fields[2]
        set -l symbols $fields[3]
        set -l worktree_path $fields[4]
        set -l pr_status 'gh unavailable'

        if test $pr_lookup = ok
            set -l pr_json (gh pr list --head "$branch" --state all --limit 10 --json number,state,mergedAt,url,title 2>/dev/null)
            if test $status -ne 0
                set pr_status 'gh lookup failed'
            else
                set -l pr (printf '%s\n' $pr_json | jq -r 'sort_by(.number) | last // empty | if . == "" then empty else ["#\(.number)", (if .mergedAt != null then "merged" else "not merged (\(.state | ascii_downcase))" end), .url] | @tsv end')
                if test -n "$pr"
                    set -l pr_fields (string split \t $pr)
                    set pr_status "$pr_fields[1] $pr_fields[2]"
                else
                    set pr_status none
                end
            end
        end

        set -a enriched_candidates (string join \t $branch $main_state $pr_status $symbols $worktree_path)
    end

    set -l selected
    if command -q fzf
        set selected (string join \n $enriched_candidates | fzf --multi --delimiter='\t' --with-nth=1,2,3,4,5 --header='Select worktrees to remove: branch | main_state | PR | symbols | path')
        or return
    else
        printf '%s\n' 'Cleanup candidates:'
        printf '%s\n' $enriched_candidates
        set selected $enriched_candidates
    end

    if test (count $selected) -eq 0
        printf '%s\n' 'No worktrees selected.'
        return 0
    end

    set -l branches
    for line in $selected
        set -a branches (string split \t $line)[1]
    end

    printf '%s\n' 'Selected branches:'
    printf '  %s\n' $branches

    if not set -q _flag_yes
        read -l -P 'Remove selected worktrees? [y/N] ' confirm
        string match -qi -- y $confirm; or return 1
    end

    set -l remove_args --foreground
    set -q _flag_yes; and set -a remove_args --yes
    set -q _flag_force; and set -a remove_args --force
    set -q _flag_force_delete; and set -a remove_args --force-delete

    wt remove $remove_args $branches
end
