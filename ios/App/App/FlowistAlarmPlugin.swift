import Foundation
import Capacitor
import UserNotifications
import AVFoundation

/// iOS delivers scheduled notifications after termination, but never grants third-party
/// apps a Clock-style lock-screen takeover or indefinitely looping notification audio.
enum FlowistAlarmNotifications {
    static let category = "FLOWIST_ALARM"
    static let prefix = "flowist-alarm-"
    static var pendingOpened: [AnyHashable: Any]?

    static func opened(_ notification: UNNotification) {
        var info = notification.request.content.userInfo
        // For repeating and snoozed reminders the occurrence is the delivery date.
        info["scheduledAt"] = notification.date.timeIntervalSince1970 * 1000
        pendingOpened = info
        NotificationCenter.default.post(name: Notification.Name("FlowistAlarmOpened"), object: nil, userInfo: info)
    }

    static func configure() {
        let snooze = UNNotificationAction(identifier: "FLOWIST_SNOOZE", title: "Snooze 5 min", options: [])
        let dismiss = UNNotificationAction(identifier: "FLOWIST_DISMISS", title: "Dismiss", options: [.destructive])
        let alarm = UNNotificationCategory(identifier: category, actions: [snooze, dismiss], intentIdentifiers: [], options: [.customDismissAction])
        let center = UNUserNotificationCenter.current()
        center.getNotificationCategories { existing in
            center.setNotificationCategories(existing.filter { $0.identifier != category }.union([alarm]))
        }
    }

    static func handle(_ response: UNNotificationResponse) -> Bool {
        guard response.notification.request.content.categoryIdentifier == category else { return false }
        let center = UNUserNotificationCenter.current()
        let id = response.notification.request.identifier
        if response.actionIdentifier == "FLOWIST_SNOOZE" {
            let previous = response.notification.request.content
            let content = UNMutableNotificationContent()
            content.title = previous.title
            content.body = previous.body
            content.categoryIdentifier = category
            content.userInfo = previous.userInfo
            content.interruptionLevel = previous.interruptionLevel
            content.sound = previous.sound
            center.add(UNNotificationRequest(identifier: id + "-snooze", content: content,
                trigger: UNTimeIntervalNotificationTrigger(timeInterval: 300, repeats: false)))
        }
        center.removeDeliveredNotifications(withIdentifiers: [id])
        return true
    }
}

@objc(FlowistAlarmPlugin)
public class FlowistAlarmPlugin: CAPPlugin {
    private var alarmPlayer: AVAudioPlayer?

    override public func load() {
        FlowistAlarmNotifications.configure()
        NotificationCenter.default.addObserver(self, selector: #selector(alarmOpened(_:)), name: Notification.Name("FlowistAlarmOpened"), object: nil)
    }

    deinit { NotificationCenter.default.removeObserver(self) }

    @objc private func alarmOpened(_ notification: Notification) {
        guard let info = notification.userInfo else { return }
        emitOpened(info)
    }

    @objc func getOpenedAlarm(_ call: CAPPluginCall) {
        guard let pending = FlowistAlarmNotifications.pendingOpened else { call.resolve([:]); return }
        FlowistAlarmNotifications.pendingOpened = nil
        let data: [String: Any] = [
            "key": pending["key"] as? String ?? "",
            "title": pending["alarmTitle"] as? String ?? "Reminder",
            "scheduledAt": pending["scheduledAt"] as? Double ?? Date().timeIntervalSince1970 * 1000
        ]
        call.resolve(data)
    }

    private func emitOpened(_ info: [AnyHashable: Any]) {
        let data: [String: Any] = [
            "key": info["key"] as? String ?? "",
            "title": info["alarmTitle"] as? String ?? "Reminder",
            "scheduledAt": info["scheduledAt"] as? Double ?? Date().timeIntervalSince1970 * 1000
        ]
        notifyListeners("alarmOpened", data: data, retainUntilConsumed: true)
    }

    @objc func startSound(_ call: CAPPluginCall) {
        guard let url = Bundle.main.url(forResource: "flowist_alarm", withExtension: "caf") else {
            call.reject("Alarm sound missing from app")
            return
        }
        do {
            alarmPlayer?.stop()
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
            let player = try AVAudioPlayer(contentsOf: url)
            player.numberOfLoops = -1
            player.prepareToPlay()
            guard player.play() else { call.reject("Alarm sound could not play"); return }
            alarmPlayer = player
            call.resolve()
        } catch { call.reject("Alarm sound could not play", nil, error) }
    }

    @objc func stopSound(_ call: CAPPluginCall) {
        alarmPlayer?.stop()
        alarmPlayer = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        call.resolve()
    }

    @objc func schedule(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty,
              let when = call.getDouble("when"), when > Date().timeIntervalSince1970 * 1000 else {
            call.reject("Invalid alarm time or key")
            return
        }
        let title = call.getString("title") ?? "Reminder"
        let priority = call.getString("priority") ?? "None"
        let repeatDays = call.getInt("repeatDays") ?? 0
        let center = UNUserNotificationCenter.current()
        let id = FlowistAlarmNotifications.prefix + key
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = priority == "None" ? "Flowist reminder" : "Priority: \(priority)"
        content.categoryIdentifier = FlowistAlarmNotifications.category
        content.userInfo = ["key": key, "priority": priority, "scheduledAt": when, "alarmTitle": title]
        content.interruptionLevel = .timeSensitive
        content.sound = UNNotificationSound(named: UNNotificationSoundName("flowist_alarm.caf"))

        // Critical Alerts are deliberately not requested without Apple's restricted
        // entitlement. When approved and provisioned, enable FLOWIST_CRITICAL_ALERTS
        // in the signed iOS target and add the critical-alert entitlement.
        #if FLOWIST_CRITICAL_ALERTS
        content.interruptionLevel = .critical
        content.sound = UNNotificationSound.criticalSoundNamed(UNNotificationSoundName("flowist_alarm.caf"))
        #endif

        let date = Date(timeIntervalSince1970: when / 1000)
        let trigger: UNNotificationTrigger
        if repeatDays == 7 {
            let fields = Calendar.current.dateComponents([.weekday, .hour, .minute], from: date)
            trigger = UNCalendarNotificationTrigger(dateMatching: fields, repeats: true)
        } else {
            trigger = UNCalendarNotificationTrigger(dateMatching: Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date), repeats: false)
        }
        // Replace the matching Capacitor local notification to avoid double alerts.
        if let replacementId = call.getInt("replacementId") {
            center.removePendingNotificationRequests(withIdentifiers: [String(replacementId)])
        }
        center.removePendingNotificationRequests(withIdentifiers: [id, id + "-snooze"])
        center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger)) { error in
            if let error = error { call.reject("Unable to schedule iOS reminder: \(error.localizedDescription)") }
            else { call.resolve() }
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else { call.reject("Missing alarm key"); return }
        let id = FlowistAlarmNotifications.prefix + key
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id, id + "-snooze"])
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [id, id + "-snooze"])
        call.resolve()
    }
}