// Live language following is adapted from the Omarchy app templates (MIT).
#include "translator.h"
#include <QDir>
#include <QFile>
#include <QFileInfo>
#include <QGuiApplication>
#include <QJsonDocument>
#include <QLocale>
#include <QRegularExpression>

Translator::Translator(const QString &languageFile, const QString &catalogDirectory, QObject *parent)
    : QTranslator(parent), m_file(languageFile.isEmpty() ? QDir::homePath() + "/.config/omarchy/language" : languageFile), m_catalogs(catalogDirectory) {
    m_debounce.setSingleShot(true);
    m_debounce.setInterval(80);
    connect(&m_watcher, &QFileSystemWatcher::fileChanged, this, [this] { m_debounce.start(); });
    connect(&m_watcher, &QFileSystemWatcher::directoryChanged, this, [this] { m_debounce.start(); });
    connect(&m_debounce, &QTimer::timeout, this, &Translator::reload);
    reload();
}

QString Translator::translate(const char *, const char *source, const char *, int) const {
    const auto value = m_strings.value(QString::fromUtf8(source));
    return value.isString() ? value.toString() : QString();
}

void Translator::reload() {
    const auto watched = m_watcher.files() + m_watcher.directories();
    if (!watched.isEmpty()) m_watcher.removePaths(watched);
    QString ancestor = QFileInfo(m_file).absolutePath();
    while (!QFileInfo::exists(ancestor) && ancestor != "/") ancestor = QFileInfo(ancestor).absolutePath();
    m_watcher.addPath(ancestor);
    if (QFileInfo::exists(m_file)) m_watcher.addPath(m_file);
    QFile file(m_file);
    QString language = file.open(QIODevice::ReadOnly) ? QString::fromUtf8(file.readLine()).trimmed() : "en";
    if (!QRegularExpression("^[a-z]{2,3}(-[A-Za-z]{2})?$").match(language).hasMatch()) language = "en";
    if (language == m_language) return;
    m_language = language;
    m_strings = {};
    QStringList codes{"en", language.section('-', 0, 0), language};
    codes.removeDuplicates();
    for (const auto &code : codes) {
        QFile catalog(m_catalogs + "/" + code + ".json");
        if (!catalog.open(QIODevice::ReadOnly)) continue;
        const auto values = QJsonDocument::fromJson(catalog.readAll()).object();
        for (auto it = values.begin(); it != values.end(); ++it)
            if (it.value().isString() && !it.value().toString().isEmpty()) m_strings.insert(it.key(), it.value());
    }
    QLocale locale(language);
    QFile registry(qEnvironmentVariable("OMARCHY_PATH", "/usr/share/omarchy") + "/default/i18n/locales.json");
    if (registry.open(QIODevice::ReadOnly)) {
        const auto name = QJsonDocument::fromJson(registry.readAll()).object().value(language).toObject().value("formatLocale").toString();
        if (!name.isEmpty()) locale = QLocale(name);
    }
    QLocale::setDefault(locale);
    QGuiApplication::setLayoutDirection(locale.textDirection());
    emit changed();
}
