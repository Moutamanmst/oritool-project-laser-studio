const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Load Content Helper
const getContent = () => {
    const data = fs.readFileSync(path.join(__dirname, 'data', 'content.json'));
    return JSON.parse(data);
};

const saveContent = (data) => {
    fs.writeFileSync(path.join(__dirname, 'data', 'content.json'), JSON.stringify(data, null, 2));
};

// Appointments Helper
const getAppointments = () => {
    if (!fs.existsSync(path.join(__dirname, 'data', 'appointments.json'))) {
        return [];
    }
    const data = fs.readFileSync(path.join(__dirname, 'data', 'appointments.json'));
    return JSON.parse(data);
};

const saveAppointments = (data) => {
    fs.writeFileSync(path.join(__dirname, 'data', 'appointments.json'), JSON.stringify(data, null, 2));
};

// ============================================
// SEO HELPER FUNCTIONS
// ============================================

/**
 * Generate SEO meta data with fallbacks
 * If admin fields are empty, auto-generate from content
 */
const getSeoData = (content, pageName) => {
    const globalSeo = content.seo?.global || {};
    const pageSeo = content.seo?.pages?.[pageName] || {};
    const siteUrl = globalSeo.siteUrl || 'https://rymarchuk.vn.ua';
    
    // Auto-generate title if empty
    let title = pageSeo.title;
    if (!title) {
        switch (pageName) {
            case 'home':
                title = `${content.hero?.title || 'Лазерна епіляція'} | ${globalSeo.siteName || 'Laser Studio'}`;
                break;
            case 'price':
                title = `Ціни на послуги | ${globalSeo.siteName || 'Laser Studio'}`;
                break;
            case 'results':
                title = `Результати робіт | ${globalSeo.siteName || 'Laser Studio'}`;
                break;
            default:
                title = globalSeo.siteName || 'Laser Studio Rymarchuk';
        }
    }
    
    // Auto-generate description if empty
    let description = pageSeo.description;
    if (!description) {
        switch (pageName) {
            case 'home':
                description = `${content.about?.text1?.replace(/<[^>]*>/g, '').substring(0, 150)}...` || 
                    'Професійна лазерна епіляція та шугаринг у Вінниці.';
                break;
            case 'price':
                description = 'Актуальний прайс-лист на послуги лазерної епіляції та шугарингу. Прозорі ціни.';
                break;
            case 'results':
                description = 'Фото результатів лазерної епіляції до і після процедури.';
                break;
            default:
                description = 'Професійна лазерна епіляція у Вінниці.';
        }
    }
    
    return {
        title,
        description,
        keywords: pageSeo.keywords || '',
        canonical: `${siteUrl}${pageSeo.canonical || '/'}`,
        ogTitle: pageSeo.ogTitle || title,
        ogDescription: pageSeo.ogDescription || description,
        ogImage: pageSeo.ogImage ? `${siteUrl}${pageSeo.ogImage}` : `${siteUrl}${globalSeo.defaultImage || '/master_new.jpg'}`,
        ogType: pageSeo.ogType || 'website',
        ogUrl: `${siteUrl}${pageSeo.canonical || '/'}`,
        robots: pageSeo.robots || 'index, follow',
        siteName: globalSeo.siteName || 'Laser Studio Rymarchuk',
        siteUrl,
        locale: globalSeo.locale || 'uk_UA',
        twitterHandle: globalSeo.twitterHandle || '',
        organization: globalSeo.organization || {}
    };
};

/**
 * Generate JSON-LD Schema.org markup
 */
const generateSchema = (content, pageName, seoData) => {
    const org = seoData.organization;
    const schemas = [];
    
    // Organization Schema (always include)
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${seoData.siteUrl}/#organization`,
        "name": org.name || seoData.siteName,
        "url": seoData.siteUrl,
        "logo": {
            "@type": "ImageObject",
            "url": `${seoData.siteUrl}${org.logo || '/master_new.jpg'}`
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": org.phone || content.site?.phoneLink,
            "contactType": "customer service",
            "availableLanguage": ["Ukrainian", "Russian"]
        },
        "sameAs": [
            content.site?.instagram
        ].filter(Boolean)
    };
    schemas.push(organizationSchema);
    
    // LocalBusiness / BeautySalon Schema
    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "BeautySalon",
        "@id": `${seoData.siteUrl}/#localbusiness`,
        "name": org.name || seoData.siteName,
        "image": `${seoData.siteUrl}${org.logo || '/master_new.jpg'}`,
        "url": seoData.siteUrl,
        "telephone": org.phone || content.site?.phoneLink,
        "priceRange": org.priceRange || "$$",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": org.address?.street || "вул. Соборна, 41",
            "addressLocality": org.address?.city || "Вінниця",
            "addressRegion": org.address?.region || "Вінницька область",
            "postalCode": org.address?.postalCode || "21000",
            "addressCountry": org.address?.country || "UA"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": parseFloat(org.geo?.latitude) || 49.2331,
            "longitude": parseFloat(org.geo?.longitude) || 28.4682
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "09:00",
            "closes": "20:00"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "reviewCount": "127"
        }
    };
    schemas.push(localBusinessSchema);
    
    // WebSite Schema
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${seoData.siteUrl}/#website`,
        "url": seoData.siteUrl,
        "name": seoData.siteName,
        "publisher": {
            "@id": `${seoData.siteUrl}/#organization`
        },
        "inLanguage": "uk-UA"
    };
    schemas.push(websiteSchema);
    
    // Breadcrumb Schema
    const breadcrumbItems = [
        { name: "Головна", url: seoData.siteUrl }
    ];
    
    if (pageName === 'price') {
        breadcrumbItems.push({ name: "Прайс-лист", url: `${seoData.siteUrl}/price` });
    } else if (pageName === 'results') {
        breadcrumbItems.push({ name: "Результати", url: `${seoData.siteUrl}/results` });
    }
    
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
        }))
    };
    schemas.push(breadcrumbSchema);
    
    // Page-specific schemas
    if (pageName === 'price' && content.prices) {
        // Service Schema with offers
        const serviceSchema = {
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Лазерна епіляція",
            "provider": {
                "@id": `${seoData.siteUrl}/#localbusiness`
            },
            "areaServed": {
                "@type": "City",
                "name": "Вінниця"
            },
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Послуги лазерної епіляції",
                "itemListElement": content.prices.flatMap(category => 
                    category.items.map(item => ({
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": item.name,
                            "category": category.category
                        },
                        "price": item.price.replace(/[^\d]/g, ''),
                        "priceCurrency": "UAH"
                    }))
                ).slice(0, 20) // Limit to avoid huge schema
            }
        };
        schemas.push(serviceSchema);
    }
    
    if (pageName === 'results' && content.portfolio) {
        // ImageGallery Schema
        const gallerySchema = {
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            "name": "Результати лазерної епіляції",
            "description": "Фото результатів до і після процедури лазерної епіляції",
            "image": content.portfolio.map(item => ({
                "@type": "ImageObject",
                "name": item.title,
                "contentUrl": `${seoData.siteUrl}/${item.image}`,
                "description": item.alt || item.title
            }))
        };
        schemas.push(gallerySchema);
    }
    
    if (pageName === 'blog' && content.blog?.posts) {
        // Blog Schema
        const blogSchema = {
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": content.blog.title || "Блог",
            "description": content.blog.subtitle,
            "url": `${seoData.siteUrl}/blog`,
            "publisher": {
                "@id": `${seoData.siteUrl}/#organization`
            },
            "blogPost": content.blog.posts.map(post => ({
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.excerpt,
                "datePublished": post.date,
                "url": `${seoData.siteUrl}/blog/${post.id}`,
                "image": `${seoData.siteUrl}/${post.image}`
            }))
        };
        schemas.push(blogSchema);
    }
    
    // Handle blog post schema
    if (pageName === 'blogPost' && arguments[3]) {
        const post = arguments[3];
        const blogSchemas = [];
        
        // Article Schema
        const articleSchema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.excerpt,
            "image": `${seoData.siteUrl}/${post.image}`,
            "datePublished": post.date,
            "dateModified": post.date,
            "author": {
                "@type": "Person",
                "name": "Анна Римарчук",
                "url": seoData.siteUrl
            },
            "publisher": {
                "@type": "Organization",
                "name": seoData.siteName,
                "logo": {
                    "@type": "ImageObject",
                    "url": `${seoData.siteUrl}/master_new.jpg`
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `${seoData.siteUrl}/blog/${post.id}`
            }
        };
        blogSchemas.push(articleSchema);
        
        // Breadcrumb for blog post
        const postBreadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Головна", "item": seoData.siteUrl },
                { "@type": "ListItem", "position": 2, "name": "Блог", "item": `${seoData.siteUrl}/blog` },
                { "@type": "ListItem", "position": 3, "name": post.title, "item": `${seoData.siteUrl}/blog/${post.id}` }
            ]
        };
        blogSchemas.push(postBreadcrumbSchema);
        
        return blogSchemas;
    }
    
    return schemas;
};

// ============================================
// ROUTES
// ============================================

app.get('/', (req, res) => {
    const content = getContent();
    const seoData = getSeoData(content, 'home');
    const schemas = generateSchema(content, 'home', seoData);
    res.render('index', { content, seo: seoData, schemas });
});

app.get('/price', (req, res) => {
    const content = getContent();
    const seoData = getSeoData(content, 'price');
    const schemas = generateSchema(content, 'price', seoData);
    res.render('price', { content, seo: seoData, schemas });
});

app.get('/results', (req, res) => {
    const content = getContent();
    const seoData = getSeoData(content, 'results');
    const schemas = generateSchema(content, 'results', seoData);
    res.render('results', { content, seo: seoData, schemas });
});

// Blog routes
app.get('/blog', (req, res) => {
    const content = getContent();
    const seoData = getSeoData(content, 'blog');
    const schemas = generateSchema(content, 'blog', seoData);
    res.render('blog', { content, seo: seoData, schemas });
});

app.get('/blog/:slug', (req, res) => {
    const content = getContent();
    const post = content.blog?.posts?.find(p => p.id === req.params.slug);
    
    if (!post) {
        return res.status(404).redirect('/blog');
    }
    
    // Custom SEO for blog post
    const seoData = {
        title: `${post.title} | Блог Rymarchuk Studio`,
        description: post.excerpt,
        keywords: content.seo?.pages?.blog?.keywords || '',
        canonical: `${content.seo?.global?.siteUrl || 'https://rymarchuk.vn.ua'}/blog/${post.id}`,
        ogTitle: post.title,
        ogDescription: post.excerpt,
        ogImage: `${content.seo?.global?.siteUrl || 'https://rymarchuk.vn.ua'}/${post.image}`,
        ogType: 'article',
        ogUrl: `${content.seo?.global?.siteUrl || 'https://rymarchuk.vn.ua'}/blog/${post.id}`,
        robots: 'index, follow',
        siteName: content.seo?.global?.siteName || 'Laser Studio Rymarchuk',
        siteUrl: content.seo?.global?.siteUrl || 'https://rymarchuk.vn.ua',
        locale: content.seo?.global?.locale || 'uk_UA',
        organization: content.seo?.global?.organization || {}
    };
    
    const schemas = generateSchema(content, 'blogPost', seoData, post);
    res.render('blog-post', { content, post, seo: seoData, schemas });
});

// Booking API
app.post('/api/book', (req, res) => {
    const { name, phone, service } = req.body;
    const appointments = getAppointments();

    const newAppointment = {
        id: Date.now(),
        date: new Date().toLocaleString('uk-UA'),
        name,
        phone,
        service,
        status: 'new'
    };

    appointments.unshift(newAppointment); // Add to beginning
    saveAppointments(appointments);

    res.json({ success: true });
});

app.get('/api/appointments/count', (req, res) => {
    const appointments = getAppointments();
    res.json({ count: appointments.length });
});

app.get('/api/appointments', (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ error: 'Unauthorized' });
    const appointments = getAppointments();
    res.json(appointments);
});

app.delete('/api/appointments/:id', (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).json({ error: 'Unauthorized' });

    const { id } = req.params;
    let appointments = getAppointments();

    // Filter out the appointment with the given ID
    appointments = appointments.filter(app => app.id.toString() !== id);

    saveAppointments(appointments);
    res.json({ success: true });
});

// ============================================
// DYNAMIC SITEMAP.XML
// ============================================
app.get('/sitemap.xml', (req, res) => {
    const content = getContent();
    const siteUrl = content.seo?.global?.siteUrl || 'https://rymarchuk.vn.ua';
    const currentDate = new Date().toISOString().split('T')[0];
    
    const pages = [
        { loc: '/', priority: '1.0', changefreq: 'weekly' },
        { loc: '/price', priority: '0.9', changefreq: 'weekly' },
        { loc: '/results', priority: '0.8', changefreq: 'monthly' },
        { loc: '/blog', priority: '0.8', changefreq: 'weekly' }
    ];
    
    // Add blog posts to sitemap
    if (content.blog?.posts) {
        content.blog.posts.forEach(post => {
            pages.push({ loc: `/blog/${post.id}`, priority: '0.7', changefreq: 'monthly' });
        });
    }
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map(page => `    <url>
        <loc>${siteUrl}${page.loc}</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
});

// ============================================
// ROBOTS.TXT
// ============================================
app.get('/robots.txt', (req, res) => {
    const content = getContent();
    const siteUrl = content.seo?.global?.siteUrl || 'https://rymarchuk.vn.ua';
    
    const robotsTxt = `# Robots.txt for ${siteUrl}
# Generated dynamically

User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /admin
Disallow: /api/

# Sitemap location
Sitemap: ${siteUrl}/sitemap.xml

# Crawl-delay (optional, be nice to servers)
Crawl-delay: 1
`;

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
});

// ============================================
// ADMIN ROUTES
// ============================================
app.get('/admin', (req, res) => {
    if (req.session.isLoggedIn) {
        const content = getContent();
        const appointments = getAppointments();
        res.render('admin/dashboard', { content, appointments });
    } else {
        res.render('admin/login');
    }
});

app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === 'admin123') { // Simple password for now
        req.session.isLoggedIn = true;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { error: 'Невірний пароль' });
    }
});

const multer = require('multer');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Admin Routes
app.post('/admin/upload', upload.single('image'), (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).send('Unauthorized');
    if (req.file) {
        res.json({ success: true, filepath: 'uploads/' + req.file.filename });
    } else {
        res.status(400).json({ success: false });
    }
});

// Helper function for deep merge
function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

app.post('/admin/update', (req, res) => {
    if (!req.session.isLoggedIn) return res.status(403).send('Unauthorized');

    // Merge new content with existing content to preserve missing fields
    const newContent = req.body;
    const existingContent = getContent(); // Get current content
    const mergedContent = deepMerge(existingContent, newContent);

    saveContent(mergedContent);
    res.json({ success: true });
});

app.get('/admin/logout', (req, res) => {
    req.session = null;
    res.redirect('/admin');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
