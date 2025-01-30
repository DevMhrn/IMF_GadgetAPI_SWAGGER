export function generateMissionSuccessProbability() {
    return Math.floor(Math.random() * 101) + '%';
}

export function generateSelfDestructCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
