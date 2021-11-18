import local from '../../assets/local.png'
import crystal from '../../assets/crystal.png'
import ruby from '../../assets/ruby.png'
import { NetworksType } from './tonClient'

const logoSwitcher = (currentNetwork: NetworksType) => {
    if (currentNetwork === "MAINNET") return crystal
    else if (currentNetwork === 'DEVNET') return ruby
    else return local
}

export default logoSwitcher