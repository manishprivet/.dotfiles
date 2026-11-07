import QtQuick
import QtQuick.Layouts
import qs.Commons as Commons
import qs.Ui as Ui
import "Model.js" as Model

FocusScope {
  id: root
  property var song: ({available: false})
  property string artwork: ""
  property string transitionAction: ""
  property bool refreshUnconfirmed: false
  property bool active: true
  property double snapshotAt: 0
  property double clock: Date.now()
  property real pendingSeek: -1
  property string seekTrack: ""
  readonly property real position: pendingSeek >= 0 ? pendingSeek : Model.positionAt(song, snapshotAt, clock)
  signal actionRequested(string action)
  signal seekRequested(real seconds, string track)
  signal appRequested()
  signal closeRequested()
  implicitHeight: Commons.Style.space(500)
  focus: true
  LayoutMirroring.enabled: Commons.I18n.rightToLeft
  LayoutMirroring.childrenInherit: true
  Commons.Translations { id: strings; directory: Qt.resolvedUrl("i18n") }
  Keys.onEscapePressed: root.closeRequested()
  Keys.onSpacePressed: if (root.song.available) root.actionRequested("toggle-play")
  onSongChanged: clock = Date.now()
  onActiveChanged: if (active) clock = Date.now()
  Timer { interval: 1000; repeat: true; running: root.active && root.song.available && !root.song.isPaused; onTriggered: root.clock = Date.now() }

  ColumnLayout {
    anchors.fill: parent
    spacing: Commons.Style.space(12)
    RowLayout {
      Layout.fillWidth: true
      Text {
        text: "YouTube Music"; textFormat: Text.PlainText
        color: Commons.Color.muted; font.family: Commons.Style.font.family
        font.pixelSize: Commons.Style.font.bodySmall
        Layout.fillWidth: true
      }
      Ui.PanelActionButton {
        objectName: "closePlayer"; iconText: "󰅖"; tooltipText: strings.t("close"); focusable: true
        onClicked: root.closeRequested()
      }
    }
    Rectangle {
      Layout.alignment: Qt.AlignHCenter
      Layout.preferredWidth: Commons.Style.space(220)
      Layout.preferredHeight: Commons.Style.space(220)
      color: Commons.Color.background
      radius: Commons.Style.cornerRadius
      Image {
        id: cover
        objectName: "albumArt"
        anchors.fill: parent
        // Only the bounded, validated, locally cached cover is handed to Qt.
        source: root.song.available ? root.artwork : ""
        fillMode: Image.PreserveAspectFit
        sourceSize.width: 440; sourceSize.height: 440
        asynchronous: true
      }
      Text {
        anchors.centerIn: parent; visible: cover.status !== Image.Ready
        text: "󰎆"; textFormat: Text.PlainText; color: Commons.Color.muted
        font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.space(64)
      }
    }
    ColumnLayout {
      Layout.fillWidth: true
      spacing: Commons.Style.space(4)
      Text {
        objectName: "songTitle"
        text: root.song.available ? root.song.title || root.song.label : strings.t("notPlaying")
        textFormat: Text.PlainText; color: Commons.Color.foreground
        font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.title; font.bold: true
        Layout.fillWidth: true; horizontalAlignment: Text.AlignHCenter
        wrapMode: Text.WordWrap; maximumLineCount: 2; elide: Text.ElideRight
      }
      Text {
        text: root.song.available ? root.song.artist || "" : strings.t("unavailable")
        textFormat: Text.PlainText; color: Commons.Color.muted
        font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.body
        Layout.fillWidth: true; horizontalAlignment: Text.AlignHCenter
        wrapMode: Text.WordWrap; maximumLineCount: 2; elide: Text.ElideRight
      }
      Text {
        visible: root.song.available && !!root.song.album
        text: root.song.album || ""; textFormat: Text.PlainText; color: Commons.Color.muted
        font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.bodySmall
        Layout.fillWidth: true; horizontalAlignment: Text.AlignHCenter; elide: Text.ElideRight
      }
    }
    ColumnLayout {
      Layout.fillWidth: true
      spacing: Commons.Style.space(2)
      Ui.PanelSlider {
        id: seekSlider
        objectName: "seekSlider"
        Layout.fillWidth: true
        minimum: 0; maximum: Math.max(1, root.song.durationSeconds || 0); integer: true; step: 5
        value: root.position
        enabled: root.song.available && root.song.durationSeconds > 0 && root.transitionAction !== "next" && root.transitionAction !== "previous"
        opacity: enabled ? 1 : 0.4
        trackColor: Commons.Color.muted; fillColor: Commons.Color.accent; knobColor: Commons.Color.foreground
        activeFocusOnTab: true
        Accessible.role: Accessible.Slider; Accessible.name: strings.t("seek")
        onDraggingChanged: if (dragging) root.seekTrack = Model.songIdentity(root.song)
        onMoved: if (!dragging) root.seekTrack = Model.songIdentity(root.song)
        onReleased: function(seconds) { root.seekRequested(seconds, root.seekTrack || Model.songIdentity(root.song)) }
        function keyboardSeek(seconds) {
          root.seekRequested(Math.max(0, Math.min(maximum, seconds)), Model.songIdentity(root.song))
        }
        Keys.onLeftPressed: keyboardSeek(value + (Commons.I18n.rightToLeft ? 5 : -5))
        Keys.onRightPressed: keyboardSeek(value + (Commons.I18n.rightToLeft ? -5 : 5))
        Keys.onPressed: function(event) {
          if (event.key === Qt.Key_Home) keyboardSeek(0)
          else if (event.key === Qt.Key_End) keyboardSeek(maximum)
          else return
          event.accepted = true
        }
      }
      RowLayout {
        Layout.fillWidth: true
        Text {
          objectName: "elapsedTime"
          text: Model.formatTime(seekSlider.dragging ? seekSlider.liveValue : root.position)
          textFormat: Text.PlainText; color: Commons.Color.muted
          font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.bodySmall
        }
        Item { Layout.fillWidth: true }
        Text {
          objectName: "durationTime"
          text: root.song.durationSeconds > 0 ? Model.formatTime(root.song.durationSeconds) : "—:—"
          textFormat: Text.PlainText; color: Commons.Color.muted
          font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.bodySmall
        }
      }
    }
    RowLayout {
      Layout.alignment: Qt.AlignHCenter
      spacing: Commons.Style.space(16)
      Ui.PanelActionButton {
        objectName: "previousTrack"; iconText: "󰒮"; tooltipText: strings.t("previous"); focusable: true
        enabled: root.song.available
        onClicked: root.actionRequested("previous")
      }
      Ui.Button {
        objectName: "togglePlayback"
        iconText: root.song.isPaused ? "󰐊" : "󰏤"
        text: strings.t(root.song.isPaused ? "play" : "pause")
        tooltipText: text; focusable: true; bordered: true
        enabled: root.song.available
        onClicked: root.actionRequested("toggle-play")
      }
      Ui.PanelActionButton {
        objectName: "nextTrack"; iconText: "󰒭"; tooltipText: strings.t("next"); focusable: true
        enabled: root.song.available
        onClicked: root.actionRequested("next")
      }
    }
    Text {
      objectName: "playerUpdateStatus"
      text: root.transitionAction ? strings.t(root.transitionAction === "next" || root.transitionAction === "previous" ? "switching" : "updating")
        : root.refreshUnconfirmed ? strings.t("notConfirmed") : ""
      textFormat: Text.PlainText; color: Commons.Color.muted
      font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.bodySmall
      Layout.fillWidth: true; horizontalAlignment: Text.AlignHCenter; wrapMode: Text.WordWrap
    }
    Item { Layout.fillHeight: true }
    Ui.Button {
      objectName: "openMusic"; text: strings.t("openApp"); focusable: true
      Layout.alignment: Qt.AlignHCenter
      onClicked: root.appRequested()
    }
  }
}
