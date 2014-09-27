module.exports = [
  {
    source: "http://dx.doi.org/10.7554/eLife.00778",
    target: "http://dx.doi.org/10.1371/journal.pbio.0030356",
    type: 'key-reference',
    description: 'This blaaaa is choosen as a key-reference because it is so awesome.',
    creator: ["Mickey Mouse"]
  },
  {
    source: "http://dx.doi.org/10.7554/eLife.03665",
    target: "http://dx.doi.org/10.7554/eLife.00461",
    type: 'advance',
    description: 'This advances the proposed method by making it better.',
    creator: ["Donald Duck"]
  },
  {
    source: "http://dx.doi.org/10.7554/eLife.03678",
    target: "http://dx.doi.org/10.7554/eLife.03665",
    type: 'insight',
    description: 'This provides an insight into the proposed work.',
    creator: ["Goofy"]
  },
  {
    target: ["http://dx.doi.org/10.7554/eLife.02763", "http://dx.doi.org/10.7554/eLife.01739", "http://dx.doi.org/10.7554/eLife.01741"],
    type: 'co-published',
    description: 'This article has been co-published.',
    creator: ["Dagobert Duck"]
  }
];
