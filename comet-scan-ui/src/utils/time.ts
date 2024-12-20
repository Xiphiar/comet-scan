export function secondsToDhms(seconds: number) {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    // console.log(d, h, m, s)
    const dDisplay = d > 0 ? d + (d == 1 ? " Day, " : " Days, ") : ""
    const hDisplay = h > 0 ? h + (h == 1 ? " Hour, " : " Hours, ") : ""
    const mDisplay = m > 0 ? m + (m == 1 ? " Minute, " : " Minutes, ") : ""
    const sDisplay = s > 0 ? s + (s == 1 ? " Second" : " Seconds") : ""
    let combined = dDisplay + hDisplay + mDisplay + sDisplay;
    if (combined.endsWith(', ')) combined = combined.slice(0, -2);
    return combined;
}