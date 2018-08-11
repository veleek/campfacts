module.exports = {
    path: "/",
    method: "GET",

    respond: async function(req, res)
    {
        res.redirect('/dashboard');
    }
};