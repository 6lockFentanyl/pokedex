
const formulario = document.querySelector("#formulario");
const botaoAleatorio = document.querySelector("#Aleatorio");
const botaoLimparTela = document.querySelector("#limparTela");
const botaoLimparHistorico = document.querySelector("#limparHistorico");

const listaHistorico = document.querySelector("#listaHistorico");

let pokemon = null;

const STAT_MAX = 200;

// carrega o histórico salvo no navegador

let historico = [];

try {
    historico = JSON.parse(localStorage.getItem("historicoPokemon")) || [];
} catch (error) {
    historico = [];
}

// pesquisa pelo formulário

formulario.addEventListener("submit", async function (event) {

    event.preventDefault();

    const nome = document.querySelector("#Buscar").value.trim();

    if (nome) {
        await buscarPokemon(nome);
    } else {
        document.querySelector("#Resultado").innerHTML =
            `<p class="erro">Digite um nome ou número válido!</p>`;

        document.body.style.removeProperty("--cor-tipo");
    }

    limparPesquisa();

});

// pesquisa um pokemon aleatório

botaoAleatorio.addEventListener("click", function () {

    buscarPokemon(NumeroAleatorio());

});

// busca as informações do pokemon

function buscarPokemon(nome) {

    nome = String(nome).toLowerCase().trim();

    return fetch(`https://pokeapi.co/api/v2/pokemon/${nome}`)

        .then(response => {

            if (!response.ok) {
                throw new Error("Pokémon não encontrado");
            }

            return response.json();

        })

        .then(data => {

            pokemon = data;

            const resultado = document.querySelector("#Resultado");

            const corTipo = CorTipoDePokemon(data.types[0].type.name);

            document.body.style.setProperty("--cor-tipo", corTipo);

            resultado.innerHTML = `

                <h2 class="nome">${data.name}</h2>

                <img src="${data.sprites.front_default}" alt="${data.name}">

                <p class="altura">Altura: ${data.height / 10} m</p>

                <p class="peso">Peso: ${data.weight / 10} kg</p>

                <p class="tipo">
                    Tipo: ${data.types.map(type => type.type.name).join(", ")}
                </p>

                ${criarStat(data, "hp", "hp", "HP")}

                ${criarStat(data, "attack", "ataque", "Ataque")}

                ${criarStat(data, "defense", "defesa", "Defesa")}

                ${criarStat(data, "speed", "velocidade", "Velocidade")}

                <div id="navegacaoPokemon">
                    <button id="pokemonAnterior" type="button" ${data.id <= 1 ? "disabled" : ""}>
                        ← Anterior
                    </button>

                    <button id="pokemonProximo" type="button" ${data.id >= 1025 ? "disabled" : ""}>
                        Próximo →
                    </button>
                </div>

            `;

            // botão para voltar um número na Pokédex

            document.querySelector("#pokemonAnterior").addEventListener("click", function () {
                if (data.id > 1) {
                    buscarPokemon(data.id - 1);
                }
            });

            // botão para avançar um número na Pokédex

            document.querySelector("#pokemonProximo").addEventListener("click", function () {
                if (data.id < 1025) {
                    buscarPokemon(data.id + 1);
                }
            });

            adicionarHistorico(data);

        })

        .catch(error => {

            pokemon = null;

            document.body.style.removeProperty("--cor-tipo");

            const resultado = document.querySelector("#Resultado");

            resultado.innerHTML = `<p class="erro">${error.message}</p>`;

        });

}

// cria as estatísticas do pokemon

function criarStat(data, statApi, classe, rotulo) {

    const valor = data.stats.find(
        stat => stat.stat.name === statApi
    ).base_stat;

    const porcentagem = Math.min((valor / STAT_MAX) * 100, 100);

    return `

        <div class="stat ${classe}">

            <span class="stat-nome">${rotulo}</span>

            <span class="stat-valor">${valor}</span>

            <div class="barra">

                <div
                    class="barra-preenchida"
                    style="--pct: ${porcentagem}%"
                ></div>

            </div>

        </div>

    `;

}

// adiciona o pokemon ao histórico

function adicionarHistorico(data) {

    // evita repetir o mesmo pokemon

    historico = historico.filter(item => item.id !== data.id);

    // coloca a pesquisa mais recente no início

    historico.unshift({
        id: data.id,
        nome: data.name
    });

    // mantém apenas os últimos 10

    historico = historico.slice(0, 10);

    // salva no navegador

    localStorage.setItem(
        "historicoPokemon",
        JSON.stringify(historico)
    );

    renderizarHistorico();

}

// mostra o histórico na página

function renderizarHistorico() {

    listaHistorico.innerHTML = "";

    if (historico.length === 0) {

        listaHistorico.innerHTML =
            "<li>Nenhuma pesquisa ainda.</li>";

        return;

    }

    historico.forEach(item => {

        const li = document.createElement("li");

        const botao = document.createElement("button");

        botao.type = "button";

        botao.textContent = `#${item.id} - ${item.nome}`;

        botao.addEventListener("click", function () {

            buscarPokemon(item.id);

        });

        li.appendChild(botao);

        listaHistorico.appendChild(li);

    });

}

// limpa apenas a tela, sem apagar o histórico

botaoLimparTela.addEventListener("click", function () {

    pokemon = null;

    document.querySelector("#Resultado").innerHTML = "";

    document.body.style.removeProperty("--cor-tipo");

    limparPesquisa();

});

// apaga todo o histórico

botaoLimparHistorico.addEventListener("click", function () {

    historico = [];

    localStorage.removeItem("historicoPokemon");

    renderizarHistorico();

});

// limpa o campo de pesquisa

function limparPesquisa() {

    const campoNome = document.querySelector("#Buscar");

    campoNome.value = "";

}

// define a cor de cada tipo de pokemon

function CorTipoDePokemon(tipo) {

    const tipos = {

        water: "#6390F0",
        dark: "#705746",
        normal: "#A8A77A",
        fire: "#EE8130",
        ground: "#E2BF65",
        flying: "#A98FF3",
        psychic: "#F95587",
        steel: "#B7B7CE",
        fairy: "#D685AD",
        ice: "#96D9D6",
        electric: "#F7D000",
        grass: "#7AC74C",
        ghost: "#735797",
        dragon: "#6F35FC",
        fighting: "#C22E2E",
        poison: "#A33EA1",
        bug: "#A8B820",
        rock: "#B6A136"

    };

    return tipos[tipo] || "#CCCCCC";

}

// gera um número aleatório

function NumeroAleatorio() {

    return Math.floor(Math.random() * 1025) + 1;

}

// mostra o histórico salvo ao abrir a página

renderizarHistorico();
