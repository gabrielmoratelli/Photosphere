var express = require('express');
var router = express.Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/posts/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const storagePerfil = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/images/profiles/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.').pop();
        cb(null, `perfil-${global.usucodigo}.${ext}`);
    }
});

const uploadPerfil = multer({ storage: storagePerfil });

function verificarAutenticacao(req, res, next) {
    if (global.usucodigo && global.usuemail) { 
        return next();
    }
    res.redirect('/'); 
}


//
// rotas GET
//

/* GET home page (login page). */
router.get('/', function(req, res, next) {
  if (global.usucodigo && global.usuemail) {
    return res.redirect('/feed');
  }
  res.render('index', { titulo: 'Photosphere - Login', mensagem: req.query.mensagem });
});

router.get('/criar', function(req, res, next) {
  res.render('index_criar', { titulo: 'Photosphere - Criar Conta' });
});

/* GET perfil page. */
router.get('/perfil', verificarAutenticacao, async (req, res) => {
    try {
        const usucodigo = global.usucodigo; 
        const usuario = await global.banco.buscarUsuarioPorCodigo(usucodigo);
        if (!usuario) {
            return res.status(404).send("Usuário não encontrado.");
        }
        res.render('perfil', { title: 'Meu Perfil', usuario: usuario });
    } catch (error) {
        res.status(500).send("Erro ao carregar o perfil: " + error);
    }
});

/* GET foto de perfil page. */
router.post('/perfil/foto', verificarAutenticacao, uploadPerfil.single('fotoPerfil'), async (req, res) => {
    try {
        const filename = req.file.filename;

        const conexao = await global.banco.conectarBD();
        const sql = "UPDATE usuarios SET usufoto = ? WHERE usucodigo = ?;";
        await conexao.query(sql, [filename, global.usucodigo]);

        res.redirect('/perfil');
    } catch (error) {
        console.error("Erro ao atualizar foto de perfil:", error);
        res.status(500).send("Erro ao atualizar foto de perfil.");
    }
});

/* GET editar perfil page. */
router.get('/perfil/editar', verificarAutenticacao, async (req, res) => {
    try {
        const usuario = await global.banco.buscarUsuarioPorCodigo(global.usucodigo);
        if (!usuario) return res.status(404).send("Usuário não encontrado.");
        res.render('editar_perfil', { usuario });
    } catch (error) {
        console.error("Erro ao carregar edição de perfil:", error);
        res.status(500).send("Erro ao carregar edição de perfil.");
    }
});


/* GET Favorito page */
router.get('/favoritos', verificarAutenticacao, async (req, res) => {
    try {
        const usucodigo = global.usucodigo; 
        const postsFavoritos = await global.banco.buscarPostsFavoritosPorUsuario(usucodigo);
        res.render('favoritos', { title: 'Meus Favoritos', posts: postsFavoritos });
    } catch (error) {
        res.status(500).send("Erro ao carregar os favoritos: " + error);
    }
});

/* GET Feed page */
router.get('/feed', verificarAutenticacao, async function(req, res, next) {
  try {
    const posts = await global.banco.buscarPosts();
    for (const post of posts) {
        post.currentUserLiked = await global.banco.verificarLike(post.postcodigo, global.usucodigo);
        post.currentUserFavorited = await global.banco.verificarFavorito(post.postcodigo, global.usucodigo);
        post.comments = await global.banco.buscarComentariosPorPost(post.postcodigo);
    }
    res.render('feed', { 
        titulo: 'Photosphere - Feed', 
        usunome: global.usunome, 
        posts: posts 
    });
  } catch (error) {
    console.error("Erro carregando o feed:", error);
    next(error);
  }
});

/* GET Create Post page */
router.get('/posts/criar', verificarAutenticacao, async (req, res) => {
    try {
        const categorias = await global.banco.listarCategoriasDisponiveis();
        res.render('criar_post', { titulo: 'Photosphere - Novo Post', categorias });
    } catch (error) {
        res.status(500).send("Erro ao carregar categorias: " + error.message);
    }
});


/* GET Logout */
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/perfil');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

router.get('/categorias', verificarAutenticacao, async (req, res) => {
    try {
        const categorias = await global.banco.listarTodasCategorias();
        res.render('categorias', { titulo: 'Categorias', categorias });
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        res.status(500).send("Erro ao carregar categorias.");
    }
});

router.get('/categorias/:id', verificarAutenticacao, async (req, res) => {
  const catcodigo = parseInt(req.params.id);
  try {
    const categoria = await global.banco.buscarCategoriaPorCodigo(catcodigo);
    if (!categoria) return res.status(404).send("Categoria não encontrada.");

    const posts = await global.banco.buscarPostsPorCategoria(catcodigo);
    for (const post of posts) {
      post.currentUserLiked = await global.banco.verificarLike(post.postcodigo, global.usucodigo);
      post.currentUserFavorited = await global.banco.verificarFavorito(post.postcodigo, global.usucodigo);
      post.comments = await global.banco.buscarComentariosPorPost(post.postcodigo);
    }

    res.render('categoria_posts', {
      titulo: `Posts da Categoria: ${categoria.catnome}`,
      categoria,
      posts
    });
  } catch (error) {
    console.error("Erro ao carregar categoria:", error);
    res.status(500).send("Erro ao carregar categoria.");
  }
});


//
// rotas POST
//

/* POST para login */
router.post('/login', async function(req, res, next){
  const email = req.body.email;
  const senha = req.body.senha;

  try {
    const usuario = await global.banco.buscarUsuario({email,senha});

    if (usuario.usucodigo) {
      global.usucodigo = usuario.usucodigo;
      global.usuemail = usuario.usuemail;
      global.usunome = usuario.usunome;
      res.redirect('/feed');
    } else {
      res.redirect('/?mensagem=Credenciais inválidas');
    }
  } catch (error) {
    console.error("Login error:", error);
    res.redirect('/?mensagem=Erro ao fazer login');
  }
});

/* POST para criar conta */
router.post('/criarConta', async function(req, res, next) {
  const nome = req.body.nome;
  const email = req.body.email;
  const senha = req.body.senha;

  try {
    if (!nome || !email || !senha) {
        return res.render('index_criar', { titulo: 'Photosphere - Criar Conta', erro: "Todos os campos são obrigatórios." });
    }
  
    const usuarioExistente = await global.banco.buscarUsuarioPorEmail(email);
      if (usuarioExistente) {
        return res.render('index_criar', { titulo: 'Photosphere - Criar Conta', erro: "Email já cadastrado." });
      }

    await global.banco.criarUsuario({ nome, email, senha });
    res.redirect('/?mensagem=Conta criada com sucesso! Faça o login.');
  } catch (error) {
    console.error("Error creating account:", error);
    res.render('index_criar', { titulo: 'Photosphere - Criar Conta', erro: "Erro ao criar conta." });
  }
});

/* POST para criar um novo post */
router.post('/posts', verificarAutenticacao, upload.single('postimage'), async function(req, res, next) {
    const { legenda, catcodigo } = req.body;
    const usucodigo = global.usucodigo;
    const postimagem = req.file ? '/uploads/posts/' + req.file.filename : null;

    if (!postimagem) {
        return res.redirect('/posts/criar?erro=Imagem é obrigatória.');
    }

    try {
        await global.banco.criarPost({ usucodigo, postimagem, postlegenda: legenda, catcodigo });
        res.redirect('/feed');
    } catch (error) {
        console.error("Erro ao criar post:", error);
        res.render('criar_post', {
            titulo: 'Photosphere - Novo Post',
            categorias: await global.banco.listarCategoriasDisponiveis(),
            erro: 'Erro ao criar post: ' + error.message
        });
    }
});


/* POST para Like/Deslike de um post */
router.post('/posts/:id/togglelike', verificarAutenticacao, async function(req, res, next) {
    const postcodigo = parseInt(req.params.id);
    const usucodigo = global.usucodigo;
    try {
        const liked = await global.banco.verificarLike(postcodigo, usucodigo);
        if (liked) {
            await global.banco.removerLike(postcodigo, usucodigo);
        } else {
            await global.banco.adicionarLike(postcodigo, usucodigo);
        }
        res.redirect('back');
    } catch (error) {
        console.error("Error toggling like:", error);
        next(error);
    }
});

/* POST para Favoritar/Desfavoritar um post */
router.post('/posts/:id/togglefavorite', verificarAutenticacao, async function(req, res, next) {
    const postcodigo = parseInt(req.params.id);
    const usucodigo = global.usucodigo;
    try {
        const favorited = await global.banco.verificarFavorito(postcodigo, usucodigo);
        if (favorited) {
            await global.banco.removerFavorito(postcodigo, usucodigo);
        } else {
            await global.banco.adicionarFavorito(postcodigo, usucodigo);
        }
        res.redirect('back');
    } catch (error) {
        console.error("Error toggling favorite:", error);
        next(error);
    }
});

/* POST para adicionar um comentário */
router.post('/posts/:id/comment', verificarAutenticacao, async function(req, res, next) {
    const postcodigo = parseInt(req.params.id);
    const usucodigo = global.usucodigo;
    const { comtexto } = req.body;

    if (!comtexto || comtexto.trim() === "") {
        return res.redirect('back');
    }

    try {
        await global.banco.adicionarComentario(postcodigo, usucodigo, comtexto);
        res.redirect('back');
    } catch (error) {
        console.error("Error adding comment:", error);
        next(error);
    }
});

/* POST categorias */

router.post('/categorias', verificarAutenticacao, async (req, res) => {
    const { catnome } = req.body;
    try {
        await global.banco.criarCategoria(global.usucodigo, catnome);
        res.redirect('/perfil'); // ou uma página de categorias
    } catch (error) {
        res.status(500).send("Erro ao criar categoria: " + error);
    }
});

/* POST favoritar categorias */
router.post('/categorias/:id/togglefavorite', verificarAutenticacao, async (req, res) => {
    const catcodigo = parseInt(req.params.id);
    try {
        const favorita = await global.banco.verificarCategoriaFavorita(global.usucodigo, catcodigo);
        if (favorita) {
            await global.banco.desfavoritarCategoria(global.usucodigo, catcodigo);
        } else {
            await global.banco.favoritarCategoria(global.usucodigo, catcodigo);
        }
        res.redirect('back');
    } catch (error) {
        res.status(500).send("Erro ao favoritar categoria: " + error);
    }
});


module.exports = router;