import { OceanEngine, type SharkKind, type SharkSpec } from "./shark";

// ?sharks=thresher,hammerhead,mako,nurse — first is biggest, the rest step down. No param: four classics.
const kinds = new URLSearchParams(location.search).get("sharks")?.split(",").filter(Boolean) as SharkKind[] | undefined;
const sharks: SharkSpec[] | undefined = kinds?.map((kind, i) => ({ kind, size: 1 - i * 0.1 }));

new OceanEngine(document.querySelector("canvas")!, sharks);

document.documentElement.dataset.theme = "day";
