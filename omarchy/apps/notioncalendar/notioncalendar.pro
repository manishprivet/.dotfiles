QT += core gui qml quick quickcontrols2
CONFIG += c++17 release
TARGET = notioncalendar
TEMPLATE = app
HEADERS += src/backend.h src/theme.h src/translator.h
SOURCES += src/main.cpp src/backend.cpp src/theme.cpp src/translator.cpp
RESOURCES += src/resources.qrc
