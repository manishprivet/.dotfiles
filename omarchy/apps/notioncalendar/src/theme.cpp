// Theme watching follows Omacut (MIT, David Heinemeier Hansson).
#include "theme.h"
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QJsonDocument>
#include <QJsonObject>
#include <QRegularExpression>
#include <QStandardPaths>

Theme::Theme(const QString &directory, QObject *parent)
    : QObject(parent), m_directory(directory.isEmpty() ? QDir::homePath() + "/.local/state/omarchy/current" : directory) {
    m_debounce.setSingleShot(true);
    m_debounce.setInterval(80);
    connect(&m_watcher, &QFileSystemWatcher::fileChanged, this, [this] { m_debounce.start(); });
    connect(&m_watcher, &QFileSystemWatcher::directoryChanged, this, [this] { m_debounce.start(); });
    connect(&m_debounce, &QTimer::timeout, this, &Theme::reload);
    m_timeout.setSingleShot(true);
    m_timeout.setInterval(500);
    connect(&m_timeout, &QTimer::timeout, &m_rounding, &QProcess::kill);
    connect(&m_rounding, &QProcess::errorOccurred, this, [this] { m_timeout.stop(); });
    connect(&m_rounding, &QProcess::finished, this, [this](int code, QProcess::ExitStatus status) {
        m_timeout.stop();
        const auto value = QJsonDocument::fromJson(m_rounding.readAllStandardOutput()).object().value("int");
        if (code == 0 && status == QProcess::NormalExit && value.isDouble() && value.toInt(-1) >= 0 && value.toInt() != m_radius) {
            m_radius = value.toInt();
            emit changed();
        }
    });
    connect(&m_poll, &QTimer::timeout, this, [this] {
        if (m_rounding.state() == QProcess::NotRunning) {
            m_rounding.start("hyprctl", {"-j", "getoption", "decoration:rounding"});
            m_timeout.start();
        }
    });
    if (directory.isEmpty() && !qEnvironmentVariableIsEmpty("HYPRLAND_INSTANCE_SIGNATURE") && !QStandardPaths::findExecutable("hyprctl").isEmpty()) {
        m_poll.start(1000);
        QMetaObject::invokeMethod(&m_poll, "timeout", Qt::QueuedConnection);
    }
    reload();
}

Theme::~Theme() {
    if (m_rounding.state() != QProcess::NotRunning) {
        m_rounding.kill();
        m_rounding.waitForFinished(1000);
    }
}

void Theme::reload() {
    const auto watched = m_watcher.files() + m_watcher.directories();
    if (!watched.isEmpty()) m_watcher.removePaths(watched);
    QString ancestor = m_directory;
    while (!QFileInfo::exists(ancestor) && ancestor != "/") ancestor = QFileInfo(ancestor).absolutePath();
    QStringList paths{ancestor, QFileInfo(ancestor).absolutePath(), m_directory, m_directory + "/theme", m_directory + "/theme/colors.toml"};
    paths.removeDuplicates();
    for (const auto &path : paths) if (QFileInfo::exists(path)) m_watcher.addPath(path);
    QFile file(m_directory + "/theme/colors.toml");
    QString accent = "#FFD60A";
    if (file.open(QIODevice::ReadOnly)) {
        const auto match = QRegularExpression(R"re(^\s*accent\s*=\s*["'](#[0-9a-fA-F]{6})["'])re", QRegularExpression::MultilineOption).match(QString::fromUtf8(file.readAll()));
        if (match.hasMatch()) accent = match.captured(1);
    }
    if (accent != m_accent) { m_accent = accent; emit changed(); }
}
