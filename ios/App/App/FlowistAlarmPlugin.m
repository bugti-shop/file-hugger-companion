#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(FlowistAlarmPlugin, "FlowistAlarm",
    CAP_PLUGIN_METHOD(schedule, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(cancel, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getOpenedAlarm, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startSound, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopSound, CAPPluginReturnPromise);
)