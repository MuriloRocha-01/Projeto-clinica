import assert from "node:assert/strict";
import { DEMO_START_MINUTES, clockToMinutes, minutesToClock, waitLabel, waitMinutes, waitTone } from "../src/services/queue-wait.ts";

assert.equal(clockToMinutes("09:42"), 582);
assert.equal(clockToMinutes("9:05"), 545);
assert.equal(clockToMinutes("24:00"), null);
assert.equal(clockToMinutes("10:75"), null);
assert.equal(clockToMinutes("abc"), null);

assert.equal(minutesToClock(582), "09:42");
assert.equal(minutesToClock(DEMO_START_MINUTES), "10:03");
assert.equal(minutesToClock(1440 + 5), "00:05");
assert.equal(minutesToClock(-5), "23:55");
assert.equal(minutesToClock(582.9), "09:42");

// Os dois pacientes de exemplo na recepção: chegaram 09:42 e 09:55, o relógio começa às 10:03
assert.equal(waitMinutes("09:42", DEMO_START_MINUTES), 21);
assert.equal(waitMinutes("09:55", DEMO_START_MINUTES), 8);
assert.equal(waitMinutes("09:55", DEMO_START_MINUTES + 7.9), 15);
assert.equal(waitMinutes("10:30", DEMO_START_MINUTES), 0);
assert.equal(waitMinutes("sem hora", DEMO_START_MINUTES), null);

assert.equal(waitTone(0), "ok");
assert.equal(waitTone(14), "ok");
assert.equal(waitTone(15), "warn");
assert.equal(waitTone(29), "warn");
assert.equal(waitTone(30), "late");

assert.equal(waitLabel(0), "Acabou de chegar");
assert.equal(waitLabel(21), "Aguardando há 21 min");
assert.equal(waitLabel(60), "Aguardando há 1 h");
assert.equal(waitLabel(65), "Aguardando há 1 h 05 min");

console.log("queue-wait ok");
