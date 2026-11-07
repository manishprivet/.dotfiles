QT += core gui qml quick quickcontrols2 testlib
CONFIG += c++17 testcase
TARGET = notioncalendar_tests
TEMPLATE = app
INCLUDEPATH += ../src
HEADERS += ../src/backend.h ../src/theme.h ../src/translator.h
SOURCES += notioncalendar_tests.cpp ../src/backend.cpp ../src/theme.cpp ../src/translator.cpp
RESOURCES += ../src/resources.qrc
