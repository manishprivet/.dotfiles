#include <QGuiApplication>
#include <QCommandLineParser>
#include <QIcon>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickStyle>
#include <QTimer>
#include "backend.h"
#include "theme.h"
#include "translator.h"

int main(int argc, char *argv[]) {
    QGuiApplication app(argc, argv);
    app.setApplicationName("notioncalendar");
    app.setApplicationVersion("0.1.0");
    app.setDesktopFileName("notioncalendar");
    app.setWindowIcon(QIcon(":/icon.svg"));
    QCommandLineParser parser;
    parser.setApplicationDescription("An unofficial desktop launcher for the official Notion Calendar website.");
    parser.addHelpOption();
    parser.addVersionOption();
    parser.addOption({"settings", "Show the native launcher and keyboard help instead of opening immediately."});
    parser.process(app);
    QQuickStyle::setStyle("Material");
    Translator translator;
    app.installTranslator(&translator);
    Theme theme;
    Backend backend;
    QQmlApplicationEngine engine;
    engine.rootContext()->setContextProperty("theme", &theme);
    engine.rootContext()->setContextProperty("translator", &translator);
    engine.rootContext()->setContextProperty("backend", &backend);
    engine.rootContext()->setContextProperty("showLauncher", parser.isSet("settings"));
    QObject::connect(&translator, &Translator::changed, &engine, &QQmlEngine::retranslate);
    QObject::connect(&backend, &Backend::opened, &app, &QCoreApplication::quit);
    engine.load(QUrl("qrc:/Main.qml"));
    if (engine.rootObjects().isEmpty()) return 1;
    if (!parser.isSet("settings")) QTimer::singleShot(0, &backend, &Backend::open);
    return app.exec();
}
