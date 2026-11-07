import QtQuick
import Quickshell
import qs.Commons as Commons
import qs.Ui as Ui
import "Model.js" as Model

Ui.BarWidget {
  id: root
  moduleName: "manish.agenda"
  property var state: AgendaState
  Binding { target: root.state; property: "databasePath"; value: root.setting("databasePath", "") }
  readonly property var next: Model.nextEvent(state.todaySnapshot ? state.todaySnapshot.events.filter(function(event) { return !event.allDay }) : [], state.now.getTime())
  readonly property bool stale: !!state.todaySnapshot && (state.todayError !== "" ||
    state.now.getTime() - state.todaySnapshot.fetchedAt > 300000 ||
    (Number(state.todaySnapshot.cacheModifiedAt || 0) > 0 && state.now.getTime() - state.todaySnapshot.cacheModifiedAt > 900000))
  readonly property bool opened: controller.open
  readonly property bool popoutSwitchClosing: false
  readonly property real openPanelIndicatorWidth: button.labelWidth
  readonly property real openPanelIndicatorHeight: Commons.Style.space(8)
  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight
  Commons.Translations { id: strings; directory: Qt.resolvedUrl("i18n") }
  Ui.PanelController { id: controller }
  function open() { state.showToday(); controller.show() }
  function close() { controller.hide() }
  function closeForPopoutSwitch() { close() }
  function refresh() { state.refresh() }
  function openEvent(url) {
    var safe = Model.safeMeetLink(url)
    if (safe) { Qt.openUrlExternally(safe); close() }
  }
  function label() {
    if (state.todayError || root.stale) return strings.t("barStale")
    if (!state.todaySnapshot) return strings.t("loading")
    if (!next) return strings.t("barEmpty")
    var gap = Model.countdown(next, state.now.getTime())
    var title = Model.truncate(next.title || strings.t("untitled"), 20)
    var when = gap.kind === "now" ? strings.t("now") : strings.t("inMinutes").arg(Commons.I18n.formatNumber(gap.minutes))
    return strings.t("barEvent").arg(title).arg(when)
  }
  function tooltip() {
    if (!state.todaySnapshot) return strings.t(state.todayError ? "unavailable" : "loading")
    if (!next) return strings.t(state.todayError ? "unavailable" : "noUpcoming")
    var locale = Qt.locale(Commons.I18n.formatLocale)
    var range = strings.t("timeRange").arg(new Date(next.start).toLocaleTimeString(locale, "HH:mm"))
      .arg(new Date(next.end).toLocaleTimeString(locale, "HH:mm"))
    var gap = Model.countdown(next, state.now.getTime())
    var when = gap.kind === "now" ? strings.t("now") : strings.t("inMinutes").arg(Commons.I18n.formatNumber(gap.minutes))
    return Model.meetingTooltip(next, range, when, strings.t("untitled"))
      + (root.stale ? "\n" + strings.t("outOfDate") : "")
  }

  Ui.WidgetButton {
    id: button
    anchors.fill: parent; bar: root.bar
    text: root.vertical ? "󰃭" : Model.sharedText(root.label())
    tooltipText: root.tooltip()
    onPressed: function(mouseButton) {
      if (mouseButton === Qt.MiddleButton) { if (root.next) root.openEvent(root.next.meet) }
      else if (mouseButton === Qt.RightButton) root.refresh()
      else if (root.opened) root.close()
      else root.open()
    }
  }
  Commons.ShellIpc {
    target: "manish.agenda"
    function open(): void { root.open() }
    function close(): void { root.close() }
    function toggle(): void { root.opened ? root.close() : root.open() }
    function refresh(): void { root.refresh() }
  }
  Ui.KeyboardPanel {
    id: panel
    anchorItem: button; owner: root; bar: root.bar; open: root.opened
    centerOnBar: false
    contentWidth: panel.fittedContentWidth(Commons.Style.space(460))
    contentHeight: panel.fittedContentHeight(Commons.Style.space(440))
    focusTarget: panel.loadedContent
    content: AgendaContent {
      anchors.fill: parent
      selectedDate: root.state.selectedDate; today: root.state.today; now: root.state.now
      snapshot: root.state.selectedSnapshot; error: root.state.selectedError
      busy: root.state.busy && root.state.runningDate === root.state.selectedDate
      onDayRequested: function(delta) { root.state.moveDate(delta) }
      onTodayRequested: root.state.showToday()
      onRefreshRequested: root.refresh()
      onEventRequested: function(url) { root.openEvent(url) }
      onCalendarRequested: { Quickshell.execDetached(["notioncalendar"]); root.close() }
      onCloseRequested: root.close()
    }
  }
}
