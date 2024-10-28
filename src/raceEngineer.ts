export type Lane = "left" | "right";
export interface Obsticle {
  type: "car" | "turn";
  lane: Lane;
}
export type Decision = string;

export const raceEngineer = async (
  start: Lane,
  sections: Iterable<() => Promise<Obsticle>>
): Promise<Decision[]> => {
  const result: string[] = [];
  let currentLane = start;

  for (const decision of sections) {
    try {
      const obsticle = await decision();
      if (obsticle.type == "car" && obsticle.lane !== currentLane) {
        result.push("speed");
      }
      if (obsticle.type == "turn" && obsticle.lane === currentLane) {
        throw "slow without change";
      } else throw "slow with change";
    } catch (dec) {
      if (dec === "slow with change") {
        currentLane = currentLane === "left" ? "right" : "left";
        result.push("slow");
      }
      if (dec === "slow without change") {
        result.push("slow");
      }
    }
  }

  return Promise.resolve(result);
};
