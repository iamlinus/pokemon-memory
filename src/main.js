import './style.css'
import '@fontsource/fredoka/400.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/fredoka/700.css'
import '@fontsource/press-start-2p/400.css'

import { screenSetup } from './js/ui.js'

// Registrera service workern (PWA / offline).
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

// Starta på inställningsskärmen.
screenSetup()
