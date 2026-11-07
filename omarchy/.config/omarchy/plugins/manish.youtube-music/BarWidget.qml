import QtQuick
import qs.Commons as Commons
import qs.Ui as Ui
import "Model.js" as Model

Ui.BarWidget {
  id: root
  moduleName: "manish.youtube-music"
  property var state: MusicState
  readonly property bool opened: controller.open
  readonly property bool popoutSwitchClosing: false
  readonly property real openPanelIndicatorWidth: button.labelWidth
  readonly property real openPanelIndicatorHeight: Commons.Style.space(8)
  readonly property string icon: state.song.available && !state.song.isPaused ? "󰎆" : "󰏤"
  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight
  Commons.Translations { id: strings; directory: Qt.resolvedUrl("i18n") }
  Ui.PanelController { id: controller }
  function open() { controller.show(); state.run("status"); state.loadArtwork() }
  function close() { controller.hide() }
  function closeForPopoutSwitch() { close() }
  Connections {
    target: root.state
    function onSongChanged() { if (root.opened) root.state.loadArtwork() }
  }
  Ui.WidgetButton {
    id: button
    objectName: "musicButton"
    anchors.fill: parent
    bar: root.bar
    text: root.vertical ? root.icon : root.icon + " " + (root.state.song.available
      ? Model.truncate(root.state.song.label, 36) : "YouTube Music")
    dimmed: !root.state.song.available || root.state.song.isPaused
    tooltipText: root.state.song.available ? Model.sharedText(root.state.song.label) + "\n"
      + strings.t(root.state.song.isPaused ? "paused" : "playing") : strings.t("unavailable")
    onPressed: function(mouseButton) {
      if (mouseButton === Qt.MiddleButton) root.state.openApp()
      else if (mouseButton === Qt.RightButton) root.state.run("next")
      else if (root.opened) { root.close(); root.state.run("status") }
      else root.open()
    }
  }
  Ui.KeyboardPanel {
    id: panel
    objectName: "musicPanel"
    anchorItem: button; owner: root; bar: root.bar; open: root.opened
    centerOnBar: false
    contentWidth: panel.fittedContentWidth(Commons.Style.space(360))
    contentHeight: panel.fittedContentHeight(Commons.Style.space(540))
    focusTarget: panel.loadedContent
    content: PlayerContent {
      anchors.fill: parent
      song: root.state.song; artwork: root.state.artwork
      transitionAction: root.state.transitionAction; refreshUnconfirmed: root.state.refreshUnconfirmed
      active: root.opened; snapshotAt: root.state.songReceivedAt; pendingSeek: root.state.pendingSeek
      onActionRequested: function(action) { root.state.run(action) }
      onSeekRequested: function(seconds, track) { root.state.seek(seconds, track) }
      onAppRequested: { root.state.openApp(); root.close() }
      onCloseRequested: { root.close(); root.state.run("status") }
    }
  }
}
