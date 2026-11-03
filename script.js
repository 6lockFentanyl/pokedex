const formulario = document.querySelector("#formulario");
const botaoAleatorio = document.querySelector("#Aleatorio");
const botaoLimparTela = document.querySelector("#limparTela");
const botaoLimparHistorico = document.querySelector("#limparHistorico");
const botaoLimparTime = document.querySelector("#limparTime");
const botaoAdicionarTime = document.querySelector("#montarTime");

const listaHistorico = document.querySelector("#listaHistorico");
const listaTime = document.querySelector("#listaTime");
const contadorTime = document.querySelector("#contadorTime");
const resultado = document.querySelector("#Resultado");

let pokemon = null;

const STAT_MAX = 200;

// carrega o histórico salvo no navegador
let historico = [];

try {
    historico = JSON.parse(localStorage.getItem("historicoPokemon")) || [];
} catch (error) {
    historico = [];
}

// carrega o time salvo no navegador
let timePokemon = [];

try {
    timePokemon = JSON.parse(localStorage.getItem("timePokemon")) || [];
} catch (error) {
    timePokemon = [];
}

// pesquisa pelo formulário
formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    const nome = document.querySelector("#Buscar").value.trim();

    if (nome) {
        await buscarPokemon(nome);
    } else {
        resultado.innerHTML =
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

            const corTipo = CorTipoDePokemon(data.types[0].type.name);

            document.body.style.setProperty("--cor-tipo", corTipo);

            resultado.innerHTML = `
                <span class="pokemon-id">
                    #${String(data.id).padStart(3, "0")}
                </span>

                <h2 class="nome">${data.name}</h2>

                <img src="${data.sprites.front_default || ""}" alt="${data.name}">

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

            atualizarBotaoTime();
            adicionarHistorico(data);
        })
        .catch(error => {
            pokemon = null;

            document.body.style.removeProperty("--cor-tipo");

            resultado.innerHTML = `<p class="erro">${error.message}</p>`;

            atualizarBotaoTime();
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
    historico = historico.filter(item => item.id !== data.id);

    historico.unshift({
        id: data.id,
        nome: data.name
    });

    historico = historico.slice(0, 10);

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

// adiciona o pokemon pesquisado ao time
function adicionarAoTime() {
    if (!pokemon) return;

    if (timePokemon.some(item => item.id === pokemon.id)) {
        alert("Esse Pokémon já está no seu time!");
        return;
    }

    if (timePokemon.length >= 6) {
        alert("Seu time já está completo!");
        return;
    }

    timePokemon.push({
        id: pokemon.id,
        nome: pokemon.name,
        imagem: pokemon.sprites.front_default
    });

    salvarTime();
    renderizarTime();
    atualizarBotaoTime();
}

// salva o time no navegador
function salvarTime() {
    localStorage.setItem(
        "timePokemon",
        JSON.stringify(timePokemon)
    );
}

// mostra os pokemon do time na página
function renderizarTime() {
    listaTime.innerHTML = "";

    contadorTime.textContent = `${timePokemon.length} de 6 Pokémon`;

    if (timePokemon.length === 0) {
        listaTime.innerHTML =
            '<li class="time-vazio">Seu time ainda está vazio.</li>';

        return;
    }

    timePokemon.forEach(item => {
        const li = document.createElement("li");

        li.innerHTML = `
            <img src="${item.imagem || ""}" alt="${item.nome}">
            #${item.id} - ${item.nome}

            <button type="button" data-id="${item.id}">
                Remover
            </button>
        `;

        listaTime.appendChild(li);
    });
}

// atualiza o botão que fica entre a carta e o time
function atualizarBotaoTime() {
    if (!botaoAdicionarTime) return;

    const jaAdicionado = pokemon &&
        timePokemon.some(item => item.id === pokemon.id);

    botaoAdicionarTime.disabled =
        !pokemon || jaAdicionado || timePokemon.length >= 6;

    if (!pokemon) {
        botaoAdicionarTime.textContent = "+ Adicionar ao meu time";
    } else if (jaAdicionado) {
        botaoAdicionarTime.textContent = "Adicionado ao time ✓";
    } else if (timePokemon.length >= 6) {
        botaoAdicionarTime.textContent = "Time completo";
    } else {
        botaoAdicionarTime.textContent = "+ Adicionar ao meu time";
    }
}

// clique no botão de adicionar ao time
botaoAdicionarTime.addEventListener("click", adicionarAoTime);

// remove um pokemon do time
listaTime.addEventListener("click", function (event) {
    const botao = event.target.closest("button[data-id]");

    if (!botao) return;

    const id = Number(botao.dataset.id);

    timePokemon = timePokemon.filter(item => item.id !== id);

    salvarTime();
    renderizarTime();
    atualizarBotaoTime();
});

// limpa o time inteiro
botaoLimparTime.addEventListener("click", function () {
    timePokemon = [];

    salvarTime();
    renderizarTime();
    atualizarBotaoTime();
});

// limpa apenas a tela, sem apagar o histórico ou o time
botaoLimparTela.addEventListener("click", function () {
    pokemon = null;

    resultado.innerHTML = "";

    document.body.style.removeProperty("--cor-tipo");

    limparPesquisa();
    atualizarBotaoTime();
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

// mostra o histórico e o time salvos ao abrir a página
renderizarHistorico();
renderizarTime();
atualizarBotaoTime();
