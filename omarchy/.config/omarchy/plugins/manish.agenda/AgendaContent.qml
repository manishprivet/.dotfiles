import QtQuick
import QtQuick.Layouts
import qs.Commons as Commons
import qs.Ui as Ui
import "Model.js" as Model

FocusScope {
  id: root
  property string selectedDate: ""
  property string today: ""
  property date now: new Date()
  property var snapshot: null
  property string error: ""
  property bool busy: false
  property int selectedIndex: 0
  readonly property var events: snapshot ? snapshot.events : []
  readonly property var locale: Qt.locale(Commons.I18n.formatLocale)
  readonly property color foreground: Commons.Color.foreground
  readonly property bool stale: Model.isStale(snapshot, error, now.getTime())
  signal dayRequested(int delta)
  signal todayRequested()
  signal refreshRequested()
  signal eventRequested(string url)
  signal calendarRequested()
  signal closeRequested()
  implicitHeight: Commons.Style.space(440)
  focus: true
  LayoutMirroring.enabled: Commons.I18n.rightToLeft
  LayoutMirroring.childrenInherit: true

  Commons.Translations { id: strings; directory: Qt.resolvedUrl("i18n") }
  function errorText(code) { return strings.t("error." + code, strings.t("error.decode")) }
  function title(event) { return event.title || strings.t("untitled") }
  function timeRange(event) {
    if (event.allDay) return strings.t("allDay")
    return strings.t("timeRange").arg(new Date(event.start).toLocaleTimeString(locale, "HH:mm"))
      .arg(new Date(event.end).toLocaleTimeString(locale, "HH:mm"))
  }
  function activate() {
    if (events[selectedIndex] && Model.safeMeetLink(events[selectedIndex].meet)) eventRequested(events[selectedIndex].meet)
  }
  onSelectedDateChanged: selectedIndex = 0
  onEventsChanged: selectedIndex = Math.max(0, Math.min(selectedIndex, events.length - 1))
  Keys.onPressed: function(event) {
    if (event.key === Qt.Key_Escape) root.closeRequested()
    else if (event.key === Qt.Key_Left) root.dayRequested(Commons.I18n.rightToLeft ? 1 : -1)
    else if (event.key === Qt.Key_Right) root.dayRequested(Commons.I18n.rightToLeft ? -1 : 1)
    else if (event.key === Qt.Key_Up || event.key === Qt.Key_Down) {
      selectedIndex = Math.max(0, Math.min(events.length - 1, selectedIndex + (event.key === Qt.Key_Up ? -1 : 1)))
      list.positionViewAtIndex(selectedIndex, ListView.Contain)
    } else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) root.activate()
    else if (event.text.toLowerCase() === "t") root.todayRequested()
    else if (event.text.toLowerCase() === "r") root.refreshRequested()
    else return
    event.accepted = true
  }

  ColumnLayout {
    anchors.fill: parent
    spacing: Commons.Style.space(12)
    RowLayout {
      Layout.fillWidth: true
      Text {
        text: strings.t("title"); textFormat: Text.PlainText
        color: root.foreground; font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.title
        Layout.fillWidth: true
      }
      Ui.PanelActionButton {
        objectName: "refreshButton"
        iconText: "󰑐"; tooltipText: strings.t("refresh"); focusable: true
        enabled: !root.busy
        onClicked: root.refreshRequested()
      }
    }
    RowLayout {
      Layout.fillWidth: true
      Ui.PanelActionButton {
        objectName: "previousButton"
        iconText: Commons.I18n.rightToLeft ? "󰅂" : "󰅁"
        tooltipText: strings.t("previous"); focusable: true
        onClicked: root.dayRequested(-1)
      }
      Text {
        text: { var date = Model.parseDate(root.selectedDate); return date ? date.toLocaleDateString(root.locale, "ddd d MMM yyyy") : "" }
        textFormat: Text.PlainText; color: Commons.Color.accent
        font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.body
        horizontalAlignment: Text.AlignHCenter; Layout.fillWidth: true; wrapMode: Text.WordWrap
      }
      Ui.PanelActionButton {
        objectName: "nextButton"
        iconText: Commons.I18n.rightToLeft ? "󰅁" : "󰅂"
        tooltipText: strings.t("next"); focusable: true
        onClicked: root.dayRequested(1)
      }
      Ui.Button {
        objectName: "todayButton"
        text: strings.t("today"); focusable: true
        enabled: root.selectedDate !== root.today
        onClicked: root.todayRequested()
      }
    }
    Text {
      visible: root.error !== "" || root.stale
      text: root.error !== "" ? root.errorText(root.error) : strings.t("stale")
      textFormat: Text.PlainText; color: Commons.Color.urgent
      font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.bodySmall
      Layout.fillWidth: true; wrapMode: Text.WordWrap
    }
    Item {
      Layout.fillWidth: true; Layout.fillHeight: true
      Text {
        anchors.centerIn: parent; width: parent.width
        visible: root.events.length === 0
        text: root.busy ? strings.t("loading") : root.error !== "" ? strings.t("unavailable") : root.snapshot ? strings.t("empty") : strings.t("loading")
        textFormat: Text.PlainText; color: Commons.Color.muted
        font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.body
        horizontalAlignment: Text.AlignHCenter; wrapMode: Text.WordWrap
      }
      ListView {
        id: list
        objectName: "eventList"
        anchors.fill: parent; clip: true
        model: root.events
        spacing: Commons.Style.space(8)
        boundsBehavior: Flickable.StopAtBounds
        delegate: Ui.BorderSurface {
          id: row
          required property var modelData
          required property int index
          width: list.width
          height: details.implicitHeight + Commons.Style.space(20)
          radius: Commons.Style.cornerRadius
          opacity: modelData.end <= root.now.getTime() ? 0.5 : 1
          color: mouse.containsMouse || root.selectedIndex === index
            ? Commons.Style.hoverFillFor(root.foreground, Commons.Color.accent) : "transparent"
          Accessible.role: Model.safeMeetLink(modelData.meet) ? Accessible.Link : Accessible.StaticText
          Accessible.name: root.title(modelData)
          Column {
            id: details
            anchors.left: parent.left; anchors.right: parent.right
            anchors.top: parent.top; anchors.margins: Commons.Style.space(10)
            spacing: Commons.Style.space(4)
            Text {
              width: parent.width; text: root.title(row.modelData); textFormat: Text.PlainText
              color: root.foreground; font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.body
              font.bold: true; wrapMode: Text.WordWrap; maximumLineCount: 2; elide: Text.ElideRight
            }
            Text {
              width: parent.width
              text: root.timeRange(row.modelData)
              textFormat: Text.PlainText; color: Commons.Color.accent
              font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.bodySmall
            }
            Text {
              width: parent.width; visible: text !== ""
              text: row.modelData.location; textFormat: Text.PlainText; color: Commons.Color.muted
              font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.bodySmall
              maximumLineCount: 1; elide: Text.ElideRight
            }
          }
          MouseArea {
            id: mouse
            anchors.fill: parent; hoverEnabled: true
            cursorShape: Model.safeMeetLink(row.modelData.meet) ? Qt.PointingHandCursor : Qt.ArrowCursor
            onEntered: root.selectedIndex = row.index
            onClicked: { root.selectedIndex = row.index; root.activate() }
          }
        }
      }
    }
    RowLayout {
      Layout.fillWidth: true
      Text {
        text: root.snapshot ? strings.t(root.stale ? "updatedStale" : "updated")
          .arg(new Date(root.snapshot.fetchedAt).toLocaleTimeString(root.locale, "HH:mm")) : ""
        textFormat: Text.PlainText; color: Commons.Color.muted
        font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.bodySmall
        Layout.fillWidth: true; wrapMode: Text.WordWrap
      }
      Ui.Button { text: strings.t("openCalendar"); focusable: true; onClicked: root.calendarRequested() }
    }
    Text {
      text: strings.t("cacheHint"); textFormat: Text.PlainText; color: Commons.Color.muted
      font.family: Commons.Style.font.family; font.pixelSize: Commons.Style.font.bodySmall
      Layout.fillWidth: true; wrapMode: Text.WordWrap
    }
  }
}
