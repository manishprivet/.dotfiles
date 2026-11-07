#pragma once
#include <QTranslator>
#include <QFileSystemWatcher>
#include <QTimer>
#include <QJsonObject>

class Translator : public QTranslator {
    Q_OBJECT
    Q_PROPERTY(QString language READ language NOTIFY changed)
public:
    explicit Translator(const QString &languageFile = {}, const QString &catalogDirectory = ":/i18n", QObject *parent = nullptr);
    QString language() const { return m_language; }
    bool isEmpty() const override { return m_strings.isEmpty(); }
    QString translate(const char *, const char *source, const char * = nullptr, int = -1) const override;
signals:
    void changed();
private:
    void reload();
    QString m_file, m_catalogs, m_language;
    QJsonObject m_strings;
    QFileSystemWatcher m_watcher;
    QTimer m_debounce;
};
