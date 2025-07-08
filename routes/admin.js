const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/posts/'),
    filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
});

const storageCategoria = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/images/categorias/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'cat-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const uploadCategoria = multer({ storage: storageCategoria });

// ROTA GET

// Página de login do admin
router.get('/admin/login', (req, res) => {
    res.render('admin_login', { titulo: 'Admin Login', erro: null });
});

// Validação de login admin
router.post('/admin/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const admin = await global.banco.buscarAdmin(email, senha);
        if (admin) {
            req.session.admin = {
                admcodigo: admin.admcodigo,
                admnome: admin.admnome
            };
            res.redirect('/admin');
        } else {
            res.render('admin_login', { titulo: 'Admin Login', erro: 'Credenciais inválidas.' });
        }
    } catch (error) {
        console.error("ERRO NO LOGIN ADMIN:", error); 
        res.status(500).send("Erro no login administrativo");
    }
});

router.get('/admin/fotos', verificarAdmin, async (req, res) => {
    try {
        const conexao = await global.banco.conectarBD();
        const [fotos] = await conexao.query("SELECT * FROM posts ORDER BY postdatacriacao DESC");
        res.render('admin_lista_fotos', { fotos });
    } catch (error) {
        res.status(500).send("Erro ao carregar fotos: " + error.message);
    }
});

// Middleware de verificação
function verificarAdmin(req, res, next) {
    if (req.session.admin && req.session.admin.admcodigo) {
        return next();
    }
    res.redirect('/admin/login');
}

// Página protegida do painel admin
router.get('/admin', verificarAdmin, async (req, res) => {
    try {
        const estatisticas = await global.banco.buscarEstatisticasDashboard();
        res.render('admin_dashboard', {
            titulo: 'Painel Administrativo',
            estatisticas,
            adminNome: req.session.admin.admnome
        });
    } catch (error) {
        res.status(500).send("Erro ao carregar o painel administrativo");
    }
});

router.get('/admin/comentarios', verificarAdmin, async (req, res) => {
    try {
        const conexao = await global.banco.conectarBD();
        const [comentarios] = await conexao.query(`
            SELECT c.*, u.usunome
            FROM comments c
            JOIN usuarios u ON c.usucodigo = u.usucodigo
            ORDER BY c.comdatacriacao DESC;
        `);
        res.render('admin_lista_comentarios', { comentarios });
    } catch (error) {
        res.status(500).send("Erro ao carregar comentários: " + error.message);
    }
});


router.get('/admin/usuarios', verificarAdmin, async (req, res) => {
    try {
        const conexao = await global.banco.conectarBD();
        const [usuarios] = await conexao.query("SELECT * FROM usuarios");
        res.render('admin_lista_usuarios', { usuarios });
    } catch (error) {
        res.status(500).send("Erro ao carregar usuários: " + error.message);
    }
});

router.get('/admin/categorias', verificarAdmin, async (req, res) => {
    try {
        const categorias = await global.banco.listarTodasCategorias();
        res.render('admin_lista_categorias', { categorias });
    } catch (error) {
        res.status(500).send("Erro ao carregar categorias: " + error.message);
    }
});

// ROTA POSTS

// Excluir usuário
router.post('/admin/categorias/:id/excluir', verificarAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const conexao = await global.banco.conectarBD();
    await conexao.query("DELETE FROM categorias WHERE catcodigo = ?", [id]);
    res.redirect('/admin/categorias');
  } catch (error) {
    res.status(500).send("Erro ao excluir categoria: " + error);
  }
});



// Excluir categoria
router.post('/admin/categorias/:id/excluir', verificarAdmin, async (req, res) => {
    try {
        const conexao = await global.banco.conectarBD();
        await conexao.query("DELETE FROM categorias WHERE catcodigo = ?", [req.params.id]);
        res.redirect('/admin/categorias');
    } catch (error) {
        res.status(500).send("Erro ao excluir categoria: " + error.message);
    }
});

// Adicionar categoria
router.post('/admin/categorias', verificarAdmin, uploadCategoria.single('catfoto'), async (req, res) => {
    const { catnome } = req.body;
    const catfoto = req.file ? '/images/categorias/' + req.file.filename : null;

    try {
        const conexao = await global.banco.conectarBD();
        const sql = "INSERT INTO categorias (catnome, catfoto) VALUES (?, ?);";
        await conexao.query(sql, [catnome, catfoto]);
        res.redirect('/admin/categorias');
    } catch (error) {
        res.status(500).send("Erro ao criar categoria: " + error);
    }
});


// Apagar categoria
router.post('/admin/categorias/:id/excluir', verificarAdmin, async (req, res) => {
    try {
        const conexao = await global.banco.conectarBD();
        const sql = "DELETE FROM categorias WHERE catcodigo = ?";
        await conexao.query(sql, [req.params.id]);
        res.redirect('/admin/categorias');
    } catch (error) {
        res.status(500).send("Erro ao excluir categoria: " + error.message);
    }
});

// Excluir foto
router.post('/admin/fotos/:id/excluir', verificarAdmin, async (req, res) => {
    try {
        const conexao = await global.banco.conectarBD();
        const [post] = await conexao.query("SELECT postimagem FROM posts WHERE postcodigo = ?", [req.params.id]);
        if (post.length > 0) {
            const filePath = 'public' + post[0].postimagem;
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await conexao.query("DELETE FROM posts WHERE postcodigo = ?", [req.params.id]);
        res.redirect('/admin/fotos');
    } catch (error) {
        res.status(500).send("Erro ao excluir foto: " + error.message);
    }
});

router.post('/admin/fotos', verificarAdmin, upload.single('postimage'), async (req, res) => {
    const { legenda } = req.body;
    const imagem = req.file ? '/uploads/posts/' + req.file.filename : null;
    try {
        const conexao = await global.banco.conectarBD();
        await conexao.query("INSERT INTO posts (usucodigo, postimagem, postlegenda) VALUES (?, ?, ?)", [1, imagem, legenda]);
        res.redirect('/admin/fotos');
    } catch (error) {
        res.status(500).send("Erro ao adicionar foto: " + error.message);
    }
});

router.post('/admin/comentarios/:id/excluir', verificarAdmin, async (req, res) => {
    try {
        const conexao = await global.banco.conectarBD();
        await conexao.query("DELETE FROM comments WHERE comcodigo = ?", [req.params.id]);
        res.redirect('/admin/comentarios');
    } catch (error) {
        res.status(500).send("Erro ao excluir comentário: " + error.message);
    }
});

module.exports = router;
