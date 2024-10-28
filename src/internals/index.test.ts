import { Lane, Obsticle, raceEngineer } from "../raceEngineer";

/// helpers

const obsticle: Obsticle = { type: "car", lane: "left" };

const carAt = (lane: Lane): Promise<Obsticle> =>
  Promise.resolve({ type: "car", lane });
const turnAt = (lane: Lane): Promise<Obsticle> =>
  Promise.resolve({ type: "turn", lane });

const expectLaneKeep = (o: Promise<Obsticle>, type: Obsticle["type"]) => {
  const obsticleThen = jest.spyOn(o, "then");
  const obsticleCatch = jest.spyOn(o, "catch");
  const check = async () => {
    expect(obsticleThen.mock.calls).not.toHaveLength(0);
    expect(obsticleThen.mock.calls.slice(-1)[0]?.[0]).not.toBeUndefined();
    await expect(
      Promise.resolve(
        obsticleThen.mock.calls.slice(-1)[0]?.[0]?.(undefined as any)
      )
    ).resolves.toBe(type === "car" ? "speed" : "slow");
    expect(obsticleCatch.mock.calls).toHaveLength(0);
  };
  return check;
};

const expectLaneChange = (o: Promise<Obsticle>) => {
  const obsticleThen = jest.spyOn(o, "then");
  const obsticleCatch = jest.spyOn(o, "catch");
  const check = async () => {
    expect(obsticleThen.mock.calls.slice(-1)[0]?.[0]).toBeUndefined();
    if (obsticleThen.mock.calls.length) {
      expect(obsticleThen.mock.calls.slice(-1)[0]?.[1]).not.toBeUndefined();
      await expect(async () =>
        obsticleThen.mock.calls.slice(-1)[0]?.[1]?.(undefined)
      ).rejects.toBe("slow");
    } else {
      await expect(async () =>
        obsticleCatch.mock.calls.slice(-1)[0]?.[0]?.(undefined)
      ).rejects.toBe("slow");
    }
  };
  return check;
};

/// tests

it("should call sections sequentially in the same order", async () => {
  const order: string[] = [];
  const section1 = async () => (order.push("1"), obsticle);
  const section2 = async () => (order.push("2"), obsticle);
  const section3 = async () => (order.push("3"), obsticle);
  await raceEngineer("right", [section1, section2, section3]);
  return expect(order).toEqual(["1", "2", "3"]);
});

it("should accept Iterables", async () => {
  const section = jest.fn().mockImplementation(async () => obsticle);
  const count = 5;
  const iterable = {
    count,
    [Symbol.iterator]() {
      return {
        next: () => {
          if (this.count > 0) {
            this.count -= 1;
            return { value: section, done: false };
          } else {
            return { value: undefined, done: true as const };
          }
        },
      };
    },
  };
  const res = raceEngineer("right", iterable);
  await expect(res).resolves.not.toThrow();
  return expect(section).toHaveBeenCalledTimes(count);
});

it("should not crash into the car", async () => {
  const obsticle1 = carAt("right");
  const obsticle2 = carAt("left");
  const obsticle3 = carAt("right");
  const obsticle4 = carAt("right");
  const obsticle5 = carAt("left");
  const obsticles = [obsticle1, obsticle2, obsticle3, obsticle4, obsticle5];

  const check1 = expectLaneChange(obsticle1);
  const check2 = expectLaneChange(obsticle2);
  const check3 = expectLaneChange(obsticle3);
  const check4 = expectLaneKeep(obsticle4, "car");
  const check5 = expectLaneChange(obsticle5);

  await raceEngineer(
    "right",
    obsticles.map((o) => () => o)
  );

  await check1();
  await check2();
  await check3();
  await check4();
  await check5();
});

it("should turn", async () => {
  const obsticle1 = turnAt("right");
  const obsticle2 = turnAt("left");
  const obsticle3 = turnAt("right");
  const obsticle4 = turnAt("right");
  const obsticle5 = turnAt("left");
  const obsticles = [obsticle1, obsticle2, obsticle3, obsticle4, obsticle5];

  const check1 = expectLaneKeep(obsticle1, "turn");
  const check2 = expectLaneChange(obsticle2);
  const check3 = expectLaneChange(obsticle3);
  const check4 = expectLaneKeep(obsticle4, "turn");
  const check5 = expectLaneChange(obsticle5);

  await raceEngineer(
    "right",
    obsticles.map((o) => () => o)
  );

  await check1();
  await check2();
  await check3();
  await check4();
  await check5();
});

it("should choose the fastest strategy", async () => {
  const obsticle1 = turnAt("left");
  const obsticle2 = carAt("left");
  const obsticle3 = carAt("right");
  const obsticle4 = turnAt("right");
  const obsticle5 = carAt("left");
  const obsticle6 = turnAt("right");
  const obsticle7 = carAt("right");
  const obsticle8 = carAt("left");
  const obsticle9 = turnAt("left");
  const obsticle10 = carAt("left");
  const obsticles = [
    obsticle1,
    obsticle2,
    obsticle3,
    obsticle4,
    obsticle5,
    obsticle6,
    obsticle7,
    obsticle8,
    obsticle9,
    obsticle10,
  ];

  const check1 = expectLaneKeep(obsticle1, "turn");
  const check2 = expectLaneChange(obsticle2);
  const check3 = expectLaneChange(obsticle3);
  const check4 = expectLaneChange(obsticle4);
  const check5 = expectLaneKeep(obsticle5, "car");
  const check6 = expectLaneKeep(obsticle6, "turn");
  const check7 = expectLaneChange(obsticle7);
  const check8 = expectLaneChange(obsticle8);
  const check9 = expectLaneChange(obsticle9);
  const check10 = expectLaneChange(obsticle10);

  await raceEngineer(
    "left",
    obsticles.map((o) => () => o)
  );
  await check1();
  await check2();
  await check3();
  await check4();
  await check5();
  await check6();
  await check7();
  await check8();
  await check9();
  await check10();
});
