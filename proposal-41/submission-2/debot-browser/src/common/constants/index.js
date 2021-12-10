const DB_CONTENT_TYPES = {
  DEBOT: 'debot',
}

const MEDIA_STATUS = {
  Success: 0,
  UnsupportedMediaType: 1,
  InvalidDataScheme: 2,
}

const EXPLORER_BASE_URL = 'https://ton.live/accounts/accountDetails?id='

const DEBOT_ADDRESS_SEARCH_PARAM = 'debotAddress'

const DEBOT_WC = -31
const MNEMONIC_WORD_COUNT = 12
const DERIVATION_PATH = "m/44'/396'/0'/0/0"

const TON_NETWORK_LS_FIELD = 'TON_NETWORK_LS_FIELD'

const MAIN_NETWORK = 'https://main.ton.dev'
const DEV_NETWORK = 'https://net.ton.dev'
const LOCAL_NETWORK = 'http://0.0.0.0'

const BASE_64_ID =
  '8913b27b45267aad3ee08437e64029ac38fb59274f19adca0b23c4f957c8cfa1'
const HEX_ID =
  'edfbb00d6ebd16d57a1636774845af9499b400ba417da8552f40b1250256ff8f'
const JSON_ID =
  '442288826041d564ccedc579674f17c1b0a3452df799656a9167a41ab270ec19'
const NETWORK_ID =
  'e38aed5884dc3e4426a87c083faaf4fa08109189fbc0c79281112f52e062d8ee'
const SDK_ID =
  '8fc6454f90072c9f1f6d3313ae1608f64f4a0660c6ae9f42c68b6a79e2a1bc4b'

module.exports = {
  EXPLORER_BASE_URL,
  DB_CONTENT_TYPES,
  MEDIA_STATUS,
  DEBOT_ADDRESS_SEARCH_PARAM,
  DEBOT_WC,
  MNEMONIC_WORD_COUNT,
  DERIVATION_PATH,
  TON_NETWORK_LS_FIELD,
  MAIN_NETWORK,
  DEV_NETWORK,
  LOCAL_NETWORK,
  BASE_64_ID,
  HEX_ID,
  NETWORK_ID,
  SDK_ID,
  JSON_ID,
}
