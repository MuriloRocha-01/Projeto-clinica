import assert from "node:assert/strict";
import { weekDates, appointmentEnd, calendarLanes, appointmentsOverlap } from "../src/services/calendar.ts";
import type { Appointment } from "../src/types/dashboard.ts";

assert.deepEqual(weekDates("2026-10-08"), ["2026-10-05","2026-10-06","2026-10-07","2026-10-08","2026-10-09","2026-10-10"]);
assert.equal(weekDates("2027-01-01")[0], "2026-12-28");
assert.equal(weekDates("2026-10-11")[0], "2026-10-05");
assert.equal(appointmentEnd({ time:"10:30",durationMinutes:60 } as Appointment),"11:30");
const lanes=calendarLanes([
  { id:1,time:"10:00",durationMinutes:60 },
  { id:2,time:"10:30",durationMinutes:60 },
  { id:3,time:"11:00",durationMinutes:60 },
] as Appointment[]);
assert.equal(lanes[1].lane,lanes[3].lane);
assert.notEqual(lanes[2].lane,lanes[3].lane);
assert.equal(lanes[1].count,2);
console.log("Semana, intervalos e consultas simultâneas: OK");
assert.equal(appointmentsOverlap({id:1,date:"2026-10-08",professional:"Ana",time:"10:00",durationMinutes:60},{date:"2026-10-08",professional:"Ana",time:"10:30"}),true);
assert.equal(appointmentsOverlap({id:1,date:"2026-10-08",professional:"Ana",time:"10:00",durationMinutes:60},{date:"2026-10-08",professional:"Ana",time:"11:00"}),false);
