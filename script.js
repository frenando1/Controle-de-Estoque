const SUPABASE_URL = 'https://gtntjzexcctlunyiyrwm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bnRqemV4Y2N0bHVueWl5cndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MjI4MDgsImV4cCI6MjA5NDE5ODgwOH0.Oa7l7lUi9_WHzPf670bG67LBpJ0R3T83al8jHa1XBIE';

let idEdicao = null;

const form = document.querySelector('#meuForm');
const statusMsg = document.querySelector('#statusMsg');
const btnSalvar = document.querySelector('#btnSalvar');


function valorTotalNaTela() {
    const valorTotal = document.querySelector('#valorTotal');
    const Quantidade = parseFloat(document.querySelector('#quantidade').value);
    const Preco = parseFloat(document.querySelector('#preco').value);

    valorTotal.value = (Quantidade * Preco).toFixed(2);
}

const QuantidadeInput = document.querySelector('#quantidade');
const PrecoInput = document.querySelector('#preco');

QuantidadeInput.addEventListener('input', valorTotalNaTela);
PrecoInput.addEventListener('input', valorTotalNaTela);

/**
 * 0. VERIFICAR PRODUTO DUPLICADO
 */
async function verificarProdutoDuplicado(nome) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/produtos?nome=eq.${encodeURIComponent(nome)}&select=id`,
            {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        const dados = await response.json();
        return dados.length > 0 ? dados[0] : null;
    } catch (error) {
        console.error("Erro ao verificar duplicado:", error);
        return null;
    }
}

/**
 * 1. CARREGAR REGISTROS
 */
async function carregarRegistros() {
    const listaProdutos = document.querySelector('#listaProdutos');
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/produtos?select=*&order=id.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        const dados = await response.json();
        listaProdutos.innerHTML = '';

        dados.forEach(produto => {
            const div = document.createElement('div');
            div.className = 'produto-card';

            // O status vem do cálculo automático do seu banco (CASE WHEN)
            const statusBanco = produto.status || '...';
            const corStatus = produto.quantidade > 5 ? '#28a745' : '#dc3545';

            // Garante que as notas sejam passadas como números (ou 0 se nulo)
            const quantidade = produto.quantidade || 0;
            const preco_unitario = produto.preco_unitario || 0;
            const imagem = produto.url_imagem || '';

            div.innerHTML = `
                <div class="info">
                    ${imagem ? `<img src="${imagem}" class="produto-imagem">` : ''}
                    <strong>${produto.nome}</strong><br>
                    <span>Quantidade: <span style="color: ${corStatus}">${quantidade}</span></span>
                    <span>Preço Unitário: ${preco_unitario.toFixed(2)}</span>
                    <span>Categoria: ${produto.categoria}</span>
                    <span>Valor Total: ${produto.valor_total.toFixed(2)}</span>
                </div>
                <div class="acoes">
                    <button class="btn-editar" onclick="window.prepararEdicao(${produto.id}, '${produto.nome}', ${produto.quantidade}, ${produto.preco_unitario}, ${produto.valor_total}, '${produto.categoria}', '${imagem}')">Editar</button>
                    <button class="btn-excluir" onclick="window.excluirRegistro(${produto.id})">Excluir</button>
                </div>
            `;
            listaProdutos.appendChild(div);
        });
    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
}

/**
 * 2. SALVAR OU ATUALIZAR
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.querySelector('#nome').value;
    const Quantidade = parseFloat(document.querySelector('#quantidade').value);
    const Preco = parseFloat(document.querySelector('#preco').value);
    const categoria = document.querySelector('#categoria').value;
    const urlImagem = document.querySelector('#urlImagem').value;
    const valorTotal = document.querySelector('#valorTotal').value;

    const valor_total = (Quantidade * Preco);

    let metodo = idEdicao ? 'PATCH' : 'POST';
    let url = idEdicao
        ? `${SUPABASE_URL}/rest/v1/produtos?id=eq.${idEdicao}`
        : `${SUPABASE_URL}/rest/v1/produtos`;

    if (!idEdicao) {
        const duplicado = await verificarProdutoDuplicado(nome);
        if (duplicado) {
            metodo = 'PATCH';
            url = `${SUPABASE_URL}/rest/v1/produtos?id=eq.${duplicado.id}`;
            statusMsg.textContent = "Produto duplicado encontrado. Atualizando...";
        }
    }

    if (metodo === 'POST') {
        statusMsg.textContent = "Processando...";
    }

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                nome: nome,
                valor_total: valorTotal,
                quantidade: Quantidade,
                preco_unitario: Preco,
                categoria: categoria,
                url_imagem: urlImagem || null
            })
        });

        if (response.ok) {
            statusMsg.textContent = "Sucesso!";
            apagarCampos();
            carregarRegistros();
        } else {
            const erro = await response.json();
            statusMsg.textContent = "Erro: " + erro.message;
        }
    } catch (error) {
        statusMsg.textContent = "Erro de conexão.";
    }
});

/**
 * 3. PREPARAR EDIÇÃO
 */
window.prepararEdicao = function (id, nome, quantidade, preco, valor_total, categoria, url_imagem, valorTotal) {
    idEdicao = id;
    document.querySelector('#nome').value = nome;
    document.querySelector('#quantidade').value = quantidade;
    document.querySelector('#preco').value = preco;
    document.querySelector('#categoria').value = categoria;
    document.querySelector('#urlImagem').value = url_imagem || '';
    document.querySelector('#valorTotal').value = valorTotal || '';

    btnSalvar.textContent = "Atualizar Dados";
    btnSalvar.style.backgroundColor = "#ffc107"; // Amarelo para indicar edição
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * 4. EXCLUIR E LIMPAR
 */
window.excluirRegistro = async function (id) {
    if (!confirm("Deseja excluir este registro?")) return;
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/produtos?id=eq.${id}`, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        carregarRegistros();
    } catch (e) { alert("Erro ao excluir"); }
};

window.apagarCampos = function () {
    form.reset();
    idEdicao = null;
    btnSalvar.textContent = "Produtos e Salvar";
    btnSalvar.style.backgroundColor = "";
    statusMsg.textContent = "";
};

carregarRegistros();