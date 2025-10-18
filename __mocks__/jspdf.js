class MockDoc {
  constructor() {
    this.internal = { pages: [1], pageSize: { getWidth: () => 210, getHeight: () => 297 }, pages: [1] }
    this._pages = this.internal.pages
  }
  setFontSize() {}
  setFont() {}
  setLineWidth() {}
  text() {}
  addPage() { this._pages.push(1) }
  line() {}
  rect() {}
  setFillColor() {}
  splitTextToSize(text) { return text.match(/.{1,80}/g) || [text] }
  output() { return 'data:application/pdf;base64,abcd1234' }
}

module.exports = { jsPDF: jest.fn().mockImplementation(() => new MockDoc()) }
