class IccRegistry {
  constructor() {
    this.iccProfile = null;
  }

  registerICCProfile(iccData) {
    this.iccProfile = iccData;
  }

  getICCProfile() {
    return this.iccProfile;
  }

  hasICCProfile() {
    return this.iccProfile !== null;
  }
}

let registry = new IccRegistry();

export function getIccRegistry() {
  return registry;
}

export function resetIccRegistry() {
  registry = new IccRegistry();
}
