const avatar =
    document.querySelector('#arthur')

const image =
    document.querySelector('#arthur-image')


//
// IMAGENS
//

const IMAGES = {

    default:
        './assets/arthur/Default.png',

    speaking:
        './assets/arthur/Speaking.png',

    shouting:
        './assets/arthur/Shouting.png'

}


//
// THRESHOLDS INICIAIS
//

const TALK_THRESHOLD = -45

const SHOUT_THRESHOLD = -10


//
// ESTADO
//

let currentState = 'default'


//
// CONEXÃO COM NODE
//

const socket =
    new WebSocket('ws://localhost:3001')


socket.addEventListener(
    'open',
    () => {

        console.log(
            'Conectado ao servidor do overlay.'
        )

    }
)


socket.addEventListener(
    'message',
    event => {

        const data =
            JSON.parse(event.data)

        if (
            data.type !== 'discord-volume'
        ) {
            return
        }

        updateAvatar(
            data.volume
        )

    }
)


socket.addEventListener(
    'close',
    () => {

        console.log(
            'Conexão com o servidor encerrada.'
        )

    }
)


//
// CLASSIFICAÇÃO
//

function updateAvatar(volume) {

/*    console.log(
        `Discord: ${volume.toFixed(1)} dB`
    )
*/
    let nextState

    if (
        volume < TALK_THRESHOLD
    ) {

        nextState = 'default'

    }

    else if (
        volume < SHOUT_THRESHOLD
    ) {

        nextState = 'speaking'

    }

    else {

        nextState = 'shouting'

    }


    setState(nextState)

}


//
// ALTERAÇÃO VISUAL
//

function setState(state) {

    if (
        state === currentState
    ) {
        return
    }

    currentState = state

    image.src =
        IMAGES[state]

    avatar.className =
        `avatar ${state}`

}