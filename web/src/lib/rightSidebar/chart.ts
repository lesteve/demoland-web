import { type IndicatorName, type Scenario, config } from "src/data/config";
import { makeColormap } from "src/utils/colors";

// Get all values for a given indicator in a given scenario.
export function getValues(indicator: IndicatorName, scenario: Scenario): number[] {
    return [...scenario.values.values()].map(m => m.get(indicator));
}

// Automatically calculate a suitable tick step size for a histogram. Chart.js's
// automatic calculation is not quite as polished as matplotlib.
//
// @param {number} max - The maximum value to be shown on the histogram.
// @param {number} min - The minimum value to be shown on the histogram.
function calculateTickStepSize(max: number, min: number): number {
    const s = (max - min) / 4; // Assuming we want 5 ticks (ish)
    if (s < 0.5) return 0.5;
    if (s < 1) return 1;
    if (s > 100) {
        const orderOfMagnitude = 10 ** Math.floor(Math.log10(s));
        return Math.round(s / orderOfMagnitude) * orderOfMagnitude;
    }
    return Math.round(s);
}

// Pretty-print a number for the chart tick labels. Again, not as polished
// as matplotlib. Apart from changing millions and thousands into 'M' and
// 'K', this also converts hyphens into proper minus signs.
//
// @param {number} value: The number to pretty-print
// @param {boolean} withSign: Whether to include a plus sign for positive
// values
export function prettyLabel(value: number, withSign: boolean = false) {
    if (typeof value === "string") return value;
    if (value === 0) return "0";
    if (value >= 1000000)
        return `${withSign ? "+" : ""}${value / 1000000}M`;
    if (value >= 1000) return `${withSign ? "+" : ""}${value / 1000}K`;
    if (value <= -1000000) return `−${Math.abs(value / 1000000)}M`;
    if (value <= -1000) return `−${Math.abs(value / 1000)}K`;
    if (value >= 0) return `${withSign ? "+" : ""}${value}`;
    return `−${Math.abs(value)}`;
}

// Generates histogram data for a distribution of values.
// 
// The range between `min` and `max` is partitioned into `nsteps` boxes, and the
// returned array contains the number of values in each box.
//
// @param {number[]} data - The values to be binned.
// @param {number} min - The minimum value to be shown on the histogram.
// @param {number} max - The maximum value to be shown on the histogram.
// @param {number} nsteps - The number of bins to use.
//
// @returns {counts: number[]; centres: number[]} An object with fields:
//   counts - An array of length `nsteps` containing the number of values in each
//            bin (from smallest to largest).
//   centres - An array of length `nsteps` containing the centre of each bin.
export function bin(
    data: number[], min: number, max: number, nsteps: number
): { counts: number[]; centres: number[] } {
    const stepSize: number = (max - min) / nsteps;
    const counts: number[] = Array(nsteps).fill(0);
    for (const d of data) {
        if (d === max) {
            // Include the maximum value in the last bin
            counts[nsteps - 1] += 1;
        }
        const bin = Math.floor((d - min) / stepSize);
        if (bin >= 0 && bin < nsteps) {
            counts[bin] += 1;
        }
    }
    const centres: number[] = Array.from({ length: nsteps }, (_, i) => min + (i + 0.5) * stepSize);

    return { counts: counts, centres: centres };
}

// Chart.js doesn't seem to export their ChartDataset type (I think).
export type ChartDataset = {
    type: string,
    label: string,
    data: number[] | { x: number, y: number }[],
    backgroundColor?: string[] | string,
    borderWidth?: number,
    showLine?: boolean,
    grouped?: boolean,
    order?: number,
    categoryPercentage?: number,
    barPercentage?: number,
    borderDash?: number[],
    borderColor?: string,
    options?: object,
    pointStyle?: string,
    pointRadius?: number,
};

export type ChartData = {
    labels: number[];
    datasets: ChartDataset[];
    tickStepSize: number;
};

export function getMean(xs: number[]) {
    return xs.reduce((a, b) => a + b, 0) / xs.length;
}


/* Generate chart data for a single scenario. */
function makeChartDataOneScenario(
    indicator: IndicatorName,
    scenario: Scenario,
    nbars: number
): ChartData {
    // Plot one dataset only (current indicator, current scenario)
    const colors: string[] = makeColormap(indicator, nbars);
    const rawValues: number[] = getValues(indicator, scenario);
    const bins = bin(rawValues, config.scale.min, config.scale.max, nbars);
    const mean = getMean(rawValues);

    return {
        datasets: [
            {
                type: "scatter",
                label: `Mean: ${mean.toFixed(2)}`,
                data: [{ "x": mean, "y": 5 }, { "x": mean, "y": Math.max(...bins.counts) * 1.1 }],
                showLine: true,
                pointStyle: "line",
                pointRadius: 0,
                borderDash: [6, 3],
                borderWidth: 1.5,
                borderColor: "#000000",
            },
            {
                type: "bar",
                label: scenario.metadata.short,
                data: bins.counts,
                backgroundColor: colors,
                borderWidth: 0,
                categoryPercentage: 1.0,
                barPercentage: 1.0,
                pointStyle: "rect",
            },
        ],
        labels: bins.centres,
        tickStepSize: calculateTickStepSize(config.scale.max, config.scale.min),
    };
}

/* Generate chart data for two scenarios. */
function makeChartDataTwoScenarios(
    indicator: IndicatorName,
    scenario: Scenario,
    compareScenario: Scenario,
    nbars: number
): ChartData {
    const colors: string[] = makeColormap(indicator, nbars);
    const rawValues: number[] = getValues(indicator, scenario);
    const cmpRawValues: number[] = getValues(indicator, compareScenario);
    const bins = bin(rawValues, config.scale.min, config.scale.max, nbars);
    const cmpBins = bin(cmpRawValues, config.scale.min, config.scale.max, nbars);
    const mean = getMean(rawValues);
    const cmpMean = getMean(cmpRawValues);

    return {
        datasets: [
            {
                type: "scatter",
                label: `${compareScenario.metadata.short} mean: ${cmpMean.toFixed(2)}`,
                data: [{ "x": mean, "y": 5 }, { "x": mean, "y": Math.max(...bins.counts) * 1.1 }],
                showLine: true,
                pointStyle: "line",
                pointRadius: 0,
                borderDash: [6, 3],
                borderWidth: 1.5,
                borderColor: "#ff0000",
            },
            {
                type: "scatter",
                label: `${scenario.metadata.short} mean: ${mean.toFixed(2)}`,
                data: [{ "x": mean, "y": 5 }, { "x": mean, "y": Math.max(...bins.counts) * 1.1 }],
                showLine: true,
                pointStyle: "line",
                pointRadius: 0,
                borderDash: [6, 3],
                borderWidth: 1.5,
                borderColor: "#000000",
            },
            {
                type: "bar",
                label: compareScenario.metadata.short,
                data: cmpBins.counts,
                // @ts-ignore backgroundColor can be string or string[]
                backgroundColor: "rgba(1, 1, 1, 0)",
                borderWidth: 1,
                borderColor: "#f00",
                barPercentage: 1,
                grouped: false,
                order: 1,
                categoryPercentage: 1.0,
                pointStyle: "rect",
            },
            {
                type: "bar",
                label: scenario.metadata.short,
                data: bins.counts,
                backgroundColor: colors,
                borderWidth: 0,
                grouped: false,
                order: 2,
                categoryPercentage: 1.0,
                barPercentage: 1.0,
                pointStyle: "rect",
            },
        ],
        labels: bins.centres,
        tickStepSize: calculateTickStepSize(config.scale.max, config.scale.min),
    };
}

/* Generate chart data showing the difference between two scenarios. */
function makeChartDataDifference(
    indicator: IndicatorName,
    scenario: Scenario,
    compareScenario: Scenario,
    nbars: number
): ChartData {
    const colors: string[] = makeColormap("diff", nbars);
    const scenValues: number[] = getValues(indicator, scenario);
    const cmpScenValues: number[] = getValues(indicator, compareScenario);
    const rawValues: number[] = scenValues.map((value, i) => value - cmpScenValues[i]).filter((value) => value !== 0);
    const max: number = Math.max(
        Math.abs(Math.min(...rawValues)),
        Math.abs(Math.max(...rawValues)),
        0.1  // deals with the case where all differences are zero
    );
    const min: number = -max;

    const bins = bin(rawValues, min, max, nbars);

    return {
        datasets: [
            {
                type: "bar",
                label: "Difference",
                data: bins.counts,
                backgroundColor: colors,
                borderWidth: 0,
                categoryPercentage: 1.0,
                barPercentage: 1.0,
                pointStyle: "rect",
            },
        ],
        labels: bins.centres,
        tickStepSize: calculateTickStepSize(max, min),
    };
}

/* Generate chart data. To be refactored */
export function makeChartData(
    indicator: IndicatorName,
    scenario: Scenario,
    compareScenario: Scenario | null,
    nbars: number,
    chartStyle: "both" | "difference"
): ChartData {
    if (compareScenario === null) {
        return makeChartDataOneScenario(indicator, scenario, nbars);
    }
    else {
        if (chartStyle == "both") {
            return makeChartDataTwoScenarios(indicator, scenario, compareScenario, nbars);
        }
        else if (chartStyle == "difference") {
            return makeChartDataDifference(indicator, scenario, compareScenario, nbars);
        }
    }
}
