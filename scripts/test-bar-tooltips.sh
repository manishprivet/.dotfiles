#!/usr/bin/env bash
# Real utility controls and popup tooltips, with fake services and no live commands.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
scratch=$(mktemp -d /tmp/opencode/bar-tooltips.XXXXXX)
trap 'rm -rf "$scratch"' EXIT
mkdir -p "$scratch/config/omarchy"
printf 'en\n' > "$scratch/config/omarchy/language"
ln -s /usr/share/omarchy/shell/Commons "$scratch/Commons"
ln -s /usr/share/omarchy/shell/Ui "$scratch/Ui"
ln -s "$ROOT/omarchy/.config/omarchy/plugins/manishprivet.bar" "$scratch/Bar"
cat > "$scratch/shell.qml" <<'QML'
import QtQuick
import Quickshell
import qs.Commons as Commons
import "Bar/widgets" as Widgets

FloatingWindow {
  implicitWidth: 400; implicitHeight: 160; visible: true
  QtObject {
    id: services
    property bool stayAwake: false
    property bool enabled: false
    property bool doNotDisturb: false
    function setIdleEnabled(value) { stayAwake = !value }
    function setNightlight(value) { enabled = value }
    function setDoNotDisturb(value) { doNotDisturb = value }
  }
  QtObject { id: shellApi; function firstPartyServiceFor(id) { return services } }
  QtObject {
    id: barApi
    property var shell: shellApi
    property bool vertical: false
    property int barSize: 26
    property color foreground: Commons.Color.foreground
    property color barForeground: foreground
    property color urgent: Commons.Color.urgent
    property string fontFamily: Commons.Style.font.family
    property bool foregroundAnimationEnabled: false
    function registerClickTarget(target) {}
    function unregisterClickTarget(target) {}
    function hideTooltip(target) {}
    function showTooltip(target, text) {}
  }
  Widgets.Indicators {
    id: controls
    anchors.centerIn: parent
    bar: barApi
    settings: ({ alwaysShow: true, items: ["Dnd", "NightLight", "StayAwake"] })
    panelTooltips: true
  }
  function check(value, message) { if (!value) throw new Error(message) }
  function collect(item, result) {
    if (item.item && item.item.contentItem && item.item.delay === 400) result.push(item.item)
    for (var child of (item.children || [])) collect(child, result)
  }
  Timer {
    interval: 500; running: true
    onTriggered: {
      try {
        var tips = []
        collect(controls, tips)
        check(tips.length === 3, "Every utility needs a popup-local tooltip")
        for (var tip of tips) {
          check(tip.parent && tip.parent.tooltipText, "Tooltip is not attached to its utility")
          check(tip.text === tip.parent.tooltipText, "Tooltip text differs from utility text")
          check(!tip.visible, "Tooltip appeared without hover")
          check(tip.contentItem.textFormat === Text.PlainText, "Tooltip allows markup")
          tip.parent.tooltipText = '<img src="https://example.invalid/tracker">'
          check(tip.text === tip.parent.tooltipText && tip.contentItem.text === tip.text, "Dynamic tooltip binding broke")
          check(tip.contentItem.textFormat === Text.PlainText, "Dynamic tooltip allows markup")
        }
        console.log("PASS bar tooltips: popup parenting, dynamic text, hover default, plain-text safety")
        Qt.quit()
      } catch (e) { console.error("FAIL bar tooltips: " + e.message); Qt.exit(1) }
    }
  }
  Timer { interval: 5000; running: true; onTriggered: Qt.exit(1) }
}
QML
QT_QPA_PLATFORM=offscreen QT_QUICK_BACKEND=software XDG_CONFIG_HOME="$scratch/config" \
  OMARCHY_PATH=/usr/share/omarchy quickshell --path "$scratch/shell.qml" --no-color 2>&1 | tee "$scratch/output"
grep -q 'PASS bar tooltips:' "$scratch/output"
if grep -Eq 'FAIL bar tooltips:|TypeError:|ReferenceError:|Unable to assign|Failed to load configuration' "$scratch/output"; then exit 1; fi
