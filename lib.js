const getBundeslandMap = dpBundesland => {
  let map = {}
  for (let item of dpBundesland) {
    map[item.label] = item.y
  }
  return map
}

const getBundeslandString = dpBundesland => {
  dpBundesland.sort((b1, b2) => b2.y - b1.y)

  let res = ""
  for (let item of dpBundesland) {
    res += `${item.label}: ${item.y}\n`
  }
  return res
}

module.exports = { getBundeslandMap, getBundeslandString }
