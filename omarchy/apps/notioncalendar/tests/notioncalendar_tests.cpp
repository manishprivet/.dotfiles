#include <QtTest>
#include <QTemporaryDir>
#include <QFile>
#include <QDir>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickWindow>
#include <QQuickItem>
#include <QQuickStyle>
#include <QSaveFile>
#include <QRegularExpression>
#include "backend.h"
#include "theme.h"
#include "translator.h"

class NotionCalendarTests : public QObject {
    Q_OBJECT
    static bool write(const QString &path, const QByteArray &data) {
        QSaveFile file(path);
        return file.open(QIODevice::WriteOnly) && file.write(data) == data.size() && file.commit();
    }
    static QString launcher(const QTemporaryDir &dir, const QByteArray &body) {
        const auto path = dir.filePath("omarchy");
        if (!write(path, "#!/bin/sh\n" + body)) return {};
        QFile::setPermissions(path, QFile::ReadOwner | QFile::WriteOwner | QFile::ExeOwner);
        return path;
    }
private slots:
    void initTestCase() { QQuickStyle::setStyle("Material"); }
    void launchesOfficialSiteWithoutShellInterpolation() {
        QTemporaryDir dir;
        Backend backend(nullptr, launcher(dir, "printf '%s\\n' \"$@\" > '" + dir.filePath("args").toUtf8() + "'\n"));
        QSignalSpy opened(&backend, &Backend::opened);
        backend.open();
        backend.open();
        QTRY_COMPARE(opened.count(), 1);
        QFile args(dir.filePath("args"));
        QVERIFY(args.open(QIODevice::ReadOnly));
        QCOMPARE(args.readAll(), Backend::arguments().join('\n').toUtf8() + '\n');
        QVERIFY(Backend::arguments().contains("https://calendar.notion.so/"));
        QCOMPARE(Backend::arguments().at(1), QString("or-focus-webapp"));
        const QRegularExpression windowPattern(Backend::arguments().at(2));
        QVERIFY(windowPattern.match("chrome-calendar.notion.so__-Default").hasMatch());
        QVERIFY(windowPattern.match("chrome-calendar.notion.so__-Profile_1").hasMatch());
        QVERIFY(windowPattern.match("notioncalendar").hasMatch());
        QVERIFY(!windowPattern.match("chrome-other.example__-Default").hasMatch());
        QVERIFY(backend.error().isEmpty());
    }
    void failedLaunchIsVisible() {
        QTemporaryDir dir;
        Backend backend(nullptr, launcher(dir, "echo 'browser unavailable' >&2\nexit 1\n"));
        QSignalSpy opened(&backend, &Backend::opened);
        backend.open();
        QTRY_VERIFY(!backend.error().isEmpty());
        QVERIFY(backend.error().contains("browser unavailable"));
        QCOMPARE(opened.count(), 0);
        QVERIFY(!backend.busy());
    }
    void missingExecutableIsVisible() {
        Backend backend(nullptr, "/nonexistent/notioncalendar-test-launcher");
        backend.open();
        QTRY_VERIFY(!backend.error().isEmpty());
        QVERIFY(!backend.busy());
    }
    void themeFallbackAndAtomicReplacement() {
        QTemporaryDir dir;
        QDir(dir.path()).mkpath("theme");
        Theme theme(dir.path());
        QCOMPARE(theme.accent(), QString("#FFD60A"));
        QCOMPARE(theme.radius(), 0);
        const auto path = dir.filePath("theme/colors.toml");
        QVERIFY(write(path, "accent = '#123456'\n"));
        QTRY_COMPARE(theme.accent(), QString("#123456"));
        QVERIFY(write(path, "accent = '#abcdef'\n"));
        QTRY_COMPARE(theme.accent(), QString("#abcdef"));
        QVERIFY(write(path, "accent = 'invalid'\n"));
        QTRY_COMPARE(theme.accent(), QString("#FFD60A"));
    }
    void languageFallbackAndLiveReplacement() {
        QTemporaryDir dir;
        const auto path = dir.filePath("language");
        QVERIFY(write(dir.filePath("pt.json"), R"({"Open":"Abrir","Close":"Fechar"})"));
        QVERIFY(write(dir.filePath("pt-BR.json"), R"({"Open":"Abrir agora"})"));
        Translator translator(path, dir.path());
        QCOMPARE(translator.language(), QString("en"));
        QVERIFY(translator.translate("Main", "Missing").isNull());
        QVERIFY(write(path, "pt-BR\n"));
        QTRY_COMPARE(translator.language(), QString("pt-BR"));
        QCOMPARE(translator.translate("Main", "Open"), QString("Abrir agora"));
        QCOMPARE(translator.translate("Main", "Close"), QString("Fechar"));
        QVERIFY(write(path, "da\n"));
        QTRY_COMPARE(translator.language(), QString("da"));
    }
    void realQmlInteractionAndScreenshots() {
        QTemporaryDir dir;
        const auto languageFile = dir.filePath("language");
        QVERIFY(write(languageFile, "en\n"));
        Translator translator(languageFile);
        qApp->installTranslator(&translator);
        Theme theme(dir.path());
        Backend backend(nullptr, launcher(dir, "exit 0\n"));
        QQmlApplicationEngine engine;
        connect(&translator, &Translator::changed, &engine, &QQmlEngine::retranslate);
        engine.rootContext()->setContextProperty("theme", &theme);
        engine.rootContext()->setContextProperty("translator", &translator);
        engine.rootContext()->setContextProperty("backend", &backend);
        engine.rootContext()->setContextProperty("showLauncher", true);
        engine.load(QUrl("qrc:/Main.qml"));
        QVERIFY(!engine.rootObjects().isEmpty());
        auto *window = qobject_cast<QQuickWindow *>(engine.rootObjects().first());
        QVERIFY(window);
        QVERIFY(QTest::qWaitForWindowExposed(window));
        QTest::qWait(200);
        QVERIFY(window->grabWindow().save("launcher-en.png"));
        QTest::keyClick(window, Qt::Key_Question);
        QTRY_VERIFY(window->property("helpVisible").toBool());
        QTest::keyClick(window, Qt::Key_Escape);
        QTRY_VERIFY(!window->property("helpVisible").toBool());
        QVERIFY(write(languageFile, "da\n"));
        QTRY_COMPARE(translator.language(), QString("da"));
        auto *button = window->findChild<QQuickItem *>("openButton");
        QVERIFY(button);
        QTRY_COMPARE(button->property("text").toString(), QString::fromUtf8("Åbn Notion Calendar"));
        QTest::qWait(200);
        QVERIFY(window->grabWindow().save("launcher-da.png"));
        QSignalSpy opened(&backend, &Backend::opened);
        const auto center = button->mapToScene(QPointF(button->width() / 2, button->height() / 2));
        QTest::mouseClick(window, Qt::LeftButton, Qt::NoModifier, center.toPoint());
        QTRY_COMPARE(opened.count(), 1);
        QTest::keyClick(window, Qt::Key_Space);
        QTRY_COMPARE(opened.count(), 2);
        qApp->removeTranslator(&translator);
    }
};
QTEST_MAIN(NotionCalendarTests)
#include "notioncalendar_tests.moc"
