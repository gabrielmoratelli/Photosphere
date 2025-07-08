// banco.js
const mysql = require('mysql2/promise');

async function conectarBD() {
    if (global.conexao && global.conexao.state !== 'disconnected') {
        return global.conexao;
    }
    const conexao = await mysql.createConnection({         host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'photosphere' });
    global.conexao = conexao;
    return global.conexao;
}
module.exports = { conectarBD, };

async function criarUsuario({ nome, email, senha }) {
    const conexao = await conectarBD();
    const sql = "INSERT INTO usuarios (usunome, usuemail, ususenha) VALUES (?, ?, ?);";
    try {
        await conexao.query(sql, [nome, email, senha]);
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}

async function buscarUsuario(usuario) {
    const conexao = await conectarBD();
    const sql = "SELECT * FROM usuarios WHERE usuemail=? AND ususenha=?;";
    const [usuarioEncontrado] = await conexao.query(sql, [usuario.email, usuario.senha]);
    if (usuarioEncontrado && usuarioEncontrado.length > 0) {
        return usuarioEncontrado[0];
    } else {
        return {};
    }
}

async function criarPost({ usucodigo, postimagem, postlegenda, catcodigo }) {
    const conexao = await conectarBD();
    const sql = "INSERT INTO posts (usucodigo, postimagem, postlegenda, catcodigo) VALUES (?, ?, ?, ?);";
    const [resultado] = await conexao.query(sql, [usucodigo, postimagem, postlegenda, catcodigo]);
    return resultado.insertId;
}

async function buscarPosts() {
    const conexao = await conectarBD();
    const sql = `
        SELECT 
            p.*, 
            u.usunome,
            (SELECT COUNT(*) FROM likes WHERE postcodigo = p.postcodigo) AS total_likes,
            (SELECT COUNT(*) FROM favorites WHERE postcodigo = p.postcodigo) AS total_favorites
        FROM posts p
        JOIN usuarios u ON p.usucodigo = u.usucodigo
        ORDER BY p.postdatacriacao DESC;
    `;
    const [posts] = await conexao.query(sql);
    return posts;
}

async function buscarPostPorCodigo(postcodigo) {
    const conexao = await conectarBD();
    const sql = `
        SELECT 
            p.*, 
            u.usunome,
            (SELECT COUNT(*) FROM likes WHERE postcodigo = p.postcodigo) AS total_likes,
            (SELECT COUNT(*) FROM favorites WHERE postcodigo = p.postcodigo) AS total_favorites
        FROM posts p
        JOIN usuarios u ON p.usucodigo = u.usucodigo
        WHERE p.postcodigo = ?;
    `;
    const [post] = await conexao.query(sql, [postcodigo]);
    return post.length > 0 ? post[0] : null;
}


async function adicionarLike(postcodigo, usucodigo) {
    const conexao = await conectarBD();
    const sql = "INSERT IGNORE INTO likes (postcodigo, usucodigo) VALUES (?, ?);";
    await conexao.query(sql, [postcodigo, usucodigo]);
}

async function removerLike(postcodigo, usucodigo) {
    const conexao = await conectarBD();
    const sql = "DELETE FROM likes WHERE postcodigo = ? AND usucodigo = ?;";
    await conexao.query(sql, [postcodigo, usucodigo]);
}

async function verificarLike(postcodigo, usucodigo) {
    const conexao = await conectarBD();
    const sql = "SELECT 1 FROM likes WHERE postcodigo = ? AND usucodigo = ? LIMIT 1;";
    const [rows] = await conexao.query(sql, [postcodigo, usucodigo]);
    return rows.length > 0;
}

async function adicionarFavorito(postcodigo, usucodigo) {
    const conexao = await conectarBD();
    const sql = "INSERT IGNORE INTO favorites (postcodigo, usucodigo) VALUES (?, ?);";
    await conexao.query(sql, [postcodigo, usucodigo]);
}

async function removerFavorito(postcodigo, usucodigo) {
    const conexao = await conectarBD();
    const sql = "DELETE FROM favorites WHERE postcodigo = ? AND usucodigo = ?;";
    await conexao.query(sql, [postcodigo, usucodigo]);
}

async function verificarFavorito(postcodigo, usucodigo) {
    const conexao = await conectarBD();
    const sql = "SELECT 1 FROM favorites WHERE postcodigo = ? AND usucodigo = ? LIMIT 1;";
    const [rows] = await conexao.query(sql, [postcodigo, usucodigo]);
    return rows.length > 0;
}

async function adicionarComentario(postcodigo, usucodigo, comtexto) {
    const conexao = await conectarBD();
    const sql = "INSERT INTO comments (postcodigo, usucodigo, comtexto) VALUES (?, ?, ?);";
    const [resultado] = await conexao.query(sql, [postcodigo, usucodigo, comtexto]);
    return resultado.insertId;
}

async function buscarComentariosPorPost(postcodigo) {
    const conexao = await conectarBD();
    const sql = `
        SELECT c.*, u.usunome 
        FROM comments c
        JOIN usuarios u ON c.usucodigo = u.usucodigo
        WHERE c.postcodigo = ? 
        ORDER BY c.comdatacriacao ASC;
    `;
    const [comments] = await conexao.query(sql, [postcodigo]);
    return comments;
}

async function buscarUsuarioPorCodigo(usucodigo) {
    const conexao = await conectarBD();
    const sql = "SELECT * FROM usuarios WHERE usucodigo = ?;";
    const [usuarios] = await conexao.query(sql, [usucodigo]);
    return usuarios.length > 0 ? usuarios[0] : null;
}

async function buscarPostsFavoritosPorUsuario(usucodigo) {
    const conexao = await conectarBD();
    const sql = `
        SELECT p.*, u.usunome 
        FROM posts p
        JOIN usuarios u ON p.usucodigo = u.usucodigo
        JOIN favorites f ON p.postcodigo = f.postcodigo
        WHERE f.usucodigo = ?
        ORDER BY f.favdatacriacao DESC;
    `;
    const [posts] = await conexao.query(sql, [usucodigo]);
    return posts;
}

async function criarCategoria(usucodigo, catnome) {
    const conexao = await conectarBD();
    const sql = "INSERT INTO categorias (usucodigo, catnome) VALUES (?, ?);";
    const [resultado] = await conexao.query(sql, [usucodigo, catnome]);
    return resultado.insertId;
}

async function listarCategoriasDisponiveis() {
    const conexao = await conectarBD();
    const sql = "SELECT * FROM categorias ORDER BY catnome ASC;";
    const [categorias] = await conexao.query(sql);
    return categorias;
}

async function favoritarCategoria(usucodigo, catcodigo) {
    const conexao = await conectarBD();
    const sql = "INSERT IGNORE INTO categorias_favoritas (usucodigo, catcodigo) VALUES (?, ?);";
    await conexao.query(sql, [usucodigo, catcodigo]);
}

async function desfavoritarCategoria(usucodigo, catcodigo) {
    const conexao = await conectarBD();
    const sql = "DELETE FROM categorias_favoritas WHERE usucodigo = ? AND catcodigo = ?;";
    await conexao.query(sql, [usucodigo, catcodigo]);
}

async function verificarCategoriaFavorita(usucodigo, catcodigo) {
    const conexao = await conectarBD();
    const sql = "SELECT 1 FROM categorias_favoritas WHERE usucodigo = ? AND catcodigo = ? LIMIT 1;";
    const [rows] = await conexao.query(sql, [usucodigo, catcodigo]);
    return rows.length > 0;
}

async function listarTodasCategorias() {
    const conexao = await conectarBD();
    const sql = "SELECT * FROM categorias;";
    const [categorias] = await conexao.query(sql);
    return categorias;
}

async function buscarAdmin(email, senha) {
    const conexao = await conectarBD();
    const sql = "SELECT * FROM admins WHERE admemail=? AND admsenha=?;";
    const [admins] = await conexao.query(sql, [email, senha]);
    return admins.length > 0 ? admins[0] : null;
}

async function buscarEstatisticasDashboard() {
    const conexao = await conectarBD();
    const [dados] = await conexao.query(`
        SELECT 
            (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
            (SELECT COUNT(*) FROM posts) AS total_posts,
            (SELECT COUNT(*) FROM categorias) AS total_categorias,
            (SELECT COUNT(*) FROM comments) AS total_comentarios
    `);
    return dados[0];
}

async function buscarCategoriaPorCodigo(catcodigo) {
    const conexao = await conectarBD();
    const sql = "SELECT * FROM categorias WHERE catcodigo = ?;";
    const [rows] = await conexao.query(sql, [catcodigo]);
    return rows.length > 0 ? rows[0] : null;
}

async function buscarPostsPorCategoria(catcodigo) {
    const conexao = await conectarBD();
    const sql = `
        SELECT 
            p.*, 
            u.usunome,
            (SELECT COUNT(*) FROM likes WHERE postcodigo = p.postcodigo) AS total_likes,
            (SELECT COUNT(*) FROM favorites WHERE postcodigo = p.postcodigo) AS total_favorites
        FROM posts p
        JOIN usuarios u ON p.usucodigo = u.usucodigo
        WHERE p.catcodigo = ?
        ORDER BY p.postdatacriacao DESC;
    `;
    const [posts] = await conexao.query(sql, [catcodigo]);
    return posts;
}


module.exports = {
    conectarBD, criarUsuario, buscarUsuario, criarPost, buscarPosts, buscarPostPorCodigo,
    adicionarLike, removerLike, verificarLike,
    adicionarFavorito, removerFavorito, verificarFavorito,
    adicionarComentario, buscarComentariosPorPost,
    buscarUsuarioPorCodigo, buscarPostsFavoritosPorUsuario,
    criarCategoria, listarCategoriasDisponiveis,
    favoritarCategoria, desfavoritarCategoria, verificarCategoriaFavorita,
    listarTodasCategorias, buscarAdmin,
    buscarEstatisticasDashboard,
    buscarCategoriaPorCodigo, buscarPostsPorCategoria
};
