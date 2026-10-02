import express from 'express'
import { WebSocketServer } from 'ws'
import OBSWebSocket, { EventSubscription } from 'obs-websocket-js'
import "dotenv/config"

const app = express()

const HTTP_PORT = 3000
const WS_PORT = 3001

const OBS_ADDRESS = "ws://127.0.0.1:4455"
const OBS_PASSWORD = "LejxInJBihnBjYyK"

const DISCORD_SOURCE_NAME = 'Discord'

//
// SERVIDOR HTTP
//

app.use(express.static('overlay'))

app.listen(HTTP_PORT, () => {
    console.log(`Overlay disponível em:`)
    console.log(`http://localhost:${HTTP_PORT}`)
})

//
// WEBSOCKET DO NOSSO OVERLAY
//

const wss = new WebSocketServer({
    port: WS_PORT
})

wss.on('connection', () => {
    console.log('Overlay conectado ao servidor.')
})

function enviarParaOverlay(data) {

    const mensagem = JSON.stringify(data)

    for (const client of wss.clients) {

        if (client.readyState === 1) {
            client.send(mensagem)
        }

    }

}

//
// OBS
//

const obs = new OBSWebSocket()

async function conectarOBS() {

    try {

        const info = await obs.connect(
            OBS_ADDRESS,
            OBS_PASSWORD,
            {
                rpcVersion: 1,

                eventSubscriptions:
                    EventSubscription.All |
                    EventSubscription.InputVolumeMeters
            }
        )

        console.log('Conectado ao OBS.')
        console.log(
            `OBS WebSocket: ${info.obsWebSocketVersion}`
        )

    } catch (error) {

        console.error(
            'Não foi possível conectar ao OBS:'
        )

        console.error(error)

    }

}

//
// MEDIDOR DE VOLUME
//

obs.on('InputVolumeMeters', (data) => {

    const discord = data.inputs.find(
        input =>
            input.inputName === DISCORD_SOURCE_NAME
    )

    if (!discord) {
        return
    }

    const levels = discord.inputLevelsMul

    if (!levels || levels.length === 0) {
        return
    }

    //
    // Cada canal possui valores como:
    //
    // [magnitude, peak, inputPeak]
    //
    // Para nosso MVP pegaremos o maior peak.
    //

    const peaks = levels.map(
        channel => channel[1]
    )

    const peak = Math.max(...peaks)

    //
    // Converte multiplicador linear para dB
    //

    const volumeDb =
        peak > 0
            ? 20 * Math.log10(peak)
            : -100

    enviarParaOverlay({
        type: 'discord-volume',
        volume: volumeDb
    })

})

conectarOBS()