import { getIccRegistry } from '../icc_registry';

export default {
  initPDFA(pSubset) {
    if (pSubset.charAt(pSubset.length - 3) === '-') {
      this.subset_conformance = pSubset
        .charAt(pSubset.length - 1)
        .toUpperCase();
      this.subset = parseInt(pSubset.charAt(pSubset.length - 2));
    } else {
      // Default to Basic conformance when user doesn't specify
      this.subset_conformance = 'B';
      this.subset = parseInt(pSubset.charAt(pSubset.length - 1));
    }
  },

  async endSubset() {
    this._addPdfaMetadata();
    await this._addColorOutputIntent();
  },

  async _addColorOutputIntent() {
    const iccProfile = getIccRegistry().getICCProfile();
    if (!iccProfile) {
      throw new Error(
        'ICC profile not registered. Register it using getIccRegistry().registerICCProfile()',
      );
    }

    const colorProfileRef = this.ref({
      Length: iccProfile.length,
      N: 3,
    });
    colorProfileRef.write(iccProfile);
    await colorProfileRef.end();

    const intentRef = this.ref({
      Type: 'OutputIntent',
      S: 'GTS_PDFA1',
      Info: new String('sRGB IEC61966-2.1'),
      OutputConditionIdentifier: new String('sRGB IEC61966-2.1'),
      DestOutputProfile: colorProfileRef,
    });
    await intentRef.end();

    this._root.data.OutputIntents = [intentRef];
  },

  _getPdfaid() {
    return `
        <rdf:Description xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/" rdf:about="">
            <pdfaid:part>${this.subset}</pdfaid:part>
            <pdfaid:conformance>${this.subset_conformance}</pdfaid:conformance>
        </rdf:Description>
        `;
  },

  _addPdfaMetadata() {
    this.appendXML(this._getPdfaid());
  },
};
