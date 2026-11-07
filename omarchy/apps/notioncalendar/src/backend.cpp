#include "backend.h"
#include <QStandardPaths>

Backend::Backend(QObject *parent, const QString &launcher)
    : QObject(parent), m_launcher(launcher.isEmpty() ? QStandardPaths::findExecutable("omarchy") : launcher) {
    connect(&m_process, &QProcess::stateChanged, this, &Backend::changed);
    connect(&m_process, &QProcess::errorOccurred, this, [this](QProcess::ProcessError error) {
        if (error == QProcess::FailedToStart) {
            m_error = tr("Could not start the web-app launcher: %1").arg(m_process.errorString());
            emit changed();
        }
    });
    connect(&m_process, &QProcess::finished, this, [this](int code, QProcess::ExitStatus status) {
        if (code == 0 && status == QProcess::NormalExit) {
            emit opened();
        } else {
            const QString detail = QString::fromUtf8(m_process.readAllStandardError()).trimmed().right(2000);
            m_error = tr("Could not open Notion Calendar. Check that a Chromium-based browser is installed.\n%1").arg(detail);
            emit changed();
        }
    });
}

QStringList Backend::arguments() {
    // Use Omarchy's window matching rather than opening a duplicate browser app.
    return {"launch", "or-focus-webapp", "(chrome-calendar[.]notion[.]so__-.*|notioncalendar)",
            "https://calendar.notion.so/", "--class=notioncalendar"};
}

void Backend::open() {
    if (busy()) return;
    m_error.clear();
    if (m_launcher.isEmpty()) {
        m_error = tr("Omarchy’s launcher was not found. This app requires Omarchy.");
        emit changed();
        return;
    }
    emit changed();
    m_process.start(m_launcher, arguments());
}
