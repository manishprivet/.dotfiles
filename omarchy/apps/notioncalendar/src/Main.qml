import QtQuick
import QtQuick.Controls
import QtQuick.Controls.Material
import QtQuick.Layouts

ApplicationWindow {
    id: win
    width: 640
    height: 560
    minimumWidth: 460
    minimumHeight: 480
    visible: showLauncher || backend.error.length > 0
    title: "Notion Calendar"
    color: "#101114"
    Material.theme: Material.Dark
    Material.accent: theme.accent
    Material.roundedScale: theme.radius
    property bool helpVisible: false

    Shortcut { sequence: "?"; context: Qt.ApplicationShortcut; onActivated: win.helpVisible = !win.helpVisible }
    Shortcut { sequence: "Q"; context: Qt.ApplicationShortcut; onActivated: Qt.quit() }
    Shortcut { sequence: "Space"; context: Qt.ApplicationShortcut; enabled: !backend.busy && !win.helpVisible; onActivated: backend.open() }
    Shortcut { sequence: "Escape"; context: Qt.ApplicationShortcut; onActivated: win.helpVisible = false }

    Item {
        anchors.fill: parent
        LayoutMirroring.enabled: Qt.application.layoutDirection === Qt.RightToLeft
        LayoutMirroring.childrenInherit: true
        ScrollView {
            anchors.fill: parent
            anchors.margins: 32
            contentWidth: availableWidth
            ColumnLayout {
                width: parent.width
                spacing: 18
                Image { source: "qrc:/icon.svg"; sourceSize.width: 72; sourceSize.height: 72; Layout.preferredWidth: 72; Layout.preferredHeight: 72 }
                Label { text: "Notion Calendar"; font.pixelSize: 30; font.bold: true; Layout.fillWidth: true; wrapMode: Text.WordWrap }
                Label { text: qsTr("Your calendar, in its own window."); font.pixelSize: 18; color: theme.accent; Layout.fillWidth: true; wrapMode: Text.WordWrap }
                Label {
                    text: qsTr("Open the official Notion Calendar website using your existing browser profile. Sign in there to access your calendars.")
                    color: "#c3c5cd"; Layout.fillWidth: true; wrapMode: Text.WordWrap
                }
                Label {
                    visible: backend.error.length > 0
                    text: backend.error; color: "#ffaaa5"; Layout.fillWidth: true; wrapMode: Text.WrapAnywhere
                }
                Button {
                    objectName: "openButton"
                    text: backend.busy ? qsTr("Opening…") : qsTr("Open Notion Calendar")
                    highlighted: true
                    enabled: !backend.busy
                    Layout.fillWidth: true
                    onClicked: backend.open()
                }
                Label {
                    text: qsTr("Unofficial launcher. Calendar appearance, shortcuts, and account settings are managed by Notion.")
                    font.pixelSize: 12; color: "#969aa7"; Layout.fillWidth: true; wrapMode: Text.WordWrap
                }
                Button { text: qsTr("Keyboard shortcuts"); onClicked: win.helpVisible = true }
            }
        }
    }
    Popup {
        id: help
        anchors.centerIn: Overlay.overlay
        width: Math.min(win.width - 40, 440)
        padding: 24
        modal: true
        visible: win.helpVisible
        onClosed: win.helpVisible = false
        background: Rectangle { color: "#202228"; radius: theme.radius; border.color: theme.accent }
        contentItem: ColumnLayout {
            spacing: 16
            Label { text: qsTr("Keyboard shortcuts"); font.pixelSize: 22; Layout.fillWidth: true; wrapMode: Text.WordWrap }
            Label { text: qsTr("Space — Open calendar\n? — Show shortcuts\nQ — Quit launcher\nEscape — Close help"); Layout.fillWidth: true; wrapMode: Text.WordWrap }
            Label { text: qsTr("These shortcuts apply to this launcher only. Inside the calendar, use Notion’s own shortcuts."); Layout.fillWidth: true; wrapMode: Text.WordWrap; color: "#c3c5cd" }
            Button { text: qsTr("Close"); onClicked: win.helpVisible = false }
        }
    }
}
