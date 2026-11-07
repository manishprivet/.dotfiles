#pragma once
#include <QObject>
#include <QProcess>

class Backend : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool busy READ busy NOTIFY changed)
    Q_PROPERTY(QString error READ error NOTIFY changed)
public:
    explicit Backend(QObject *parent = nullptr, const QString &launcher = {});
    bool busy() const { return m_process.state() != QProcess::NotRunning; }
    QString error() const { return m_error; }
    static QStringList arguments();
    Q_INVOKABLE void open();
signals:
    void changed();
    void opened();
private:
    QString m_launcher, m_error;
    QProcess m_process;
};
