import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import { BLOG_POSTS } from '../data/blogData';
import { OPTIMIZED_ASSETS } from '../data/content';
import { fetchBlogPosts } from '../firebase/services';
import { BlogPost } from '../types';
import { BookOpen, Clock, ArrowRight, User, X, Share2, Check } from 'lucide-react';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { SEO, ROUTE_SEO_CONFIG } from '../components/common/SEO';

export const BlogPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { params } = useNavigation();
  const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchBlogPosts()
      .then((cloudPosts) => {
        if (mounted && Array.isArray(cloudPosts) && cloudPosts.length > 0) {
          setPosts(cloudPosts);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (params.post && posts.length > 0) {
      const matched = posts.find((p) => p.id === params.post);
      if (matched) {
        setSelectedPost(matched);
      }
    } else if (!params.post && !window.location.hash.includes('post=')) {
      setSelectedPost(null);
    }
  }, [params.post, posts]);

  const openPost = useCallback((post: BlogPost) => {
    setSelectedPost(post);
    try {
      const nextHash = `#blog?post=${encodeURIComponent(post.id)}`;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, '', nextHash);
      }
    } catch {
      // ignore history errors in sandboxed frames
    }
  }, []);

  const closePost = useCallback(() => {
    setSelectedPost(null);
    try {
      if (window.location.hash !== '#blog') {
        window.history.replaceState(null, '', '#blog');
      }
    } catch {
      // ignore history errors in sandboxed frames
    }
  }, []);

  const featuredPost = posts[0] || null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white">
      {selectedPost ? (
        <SEO
          titleEn={`${selectedPost.title} | Blog | POWER WEB STUDIO AI`}
          titleHi={`${selectedPost.titleHi || selectedPost.title} | ब्लॉग | POWER WEB STUDIO AI`}
          descriptionEn={selectedPost.excerpt}
          descriptionHi={selectedPost.excerptHi || selectedPost.excerpt}
          ogTitleEn={selectedPost.title}
          ogTitleHi={selectedPost.titleHi || selectedPost.title}
          ogDescriptionEn={selectedPost.excerpt}
          ogDescriptionHi={selectedPost.excerptHi || selectedPost.excerpt}
          ogType="article"
          ogImage={OPTIMIZED_ASSETS.blogImage.jpg}
          ogImageAltEn={`${selectedPost.title} — POWER WEB STUDIO AI Engineering Blog`}
          ogImageAltHi={`${selectedPost.titleHi || selectedPost.title} — POWER WEB STUDIO AI इंजीनियरिंग ब्लॉग`}
          canonicalPath={`/blog?post=${encodeURIComponent(selectedPost.id)}`}
        />
      ) : (
        <SEO {...ROUTE_SEO_CONFIG.blog} />
      )}

      {/* Header */}
      <section className="bg-slate-50 border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('ARCHITECTURAL DISPATCH & RESEARCH', 'आर्किटेक्चरल शोध एवं विचार')}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? (
                <>
                  एंटरप्राइज इंजीनियरिंग, एंड्रॉइड और <span className="text-blue-700">सॉवरेन एआई</span> पर तकनीकी शोध
                </>
              ) : (
                <>
                  Technical Insights on Enterprise Architecture, Android & <span className="text-blue-700">Sovereign AI</span>
                </>
              )}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {t(
                'Curated technical essays written by our Principal Architects on distributed systems, offline Kotlin mobility, and data sovereignty compliance.',
                'हमारे प्रमुख आर्किटेक्ट्स द्वारा वितरित सिस्टम, ऑफलाइन कोटलिन और डेटा अनुपालन पर लिखे गए शोध लेख।'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-12">
        {/* Featured Editorial Banner */}
        {featuredPost && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
            <OptimizedImage
              assetKey="blogImage"
              alt={`Power Web Studio AI Engineering Blog — ${featuredPost.title}`}
              altHi={`पावर वेब स्टूडियो एआई इंजीनियरिंग ब्लॉग — ${featuredPost.titleHi || featuredPost.title}`}
              width={1200}
              height={896}
              loading="eager"
              sizes="100vw"
              priority
              className="w-full h-64 sm:h-80 lg:h-96 object-cover opacity-45 transition-transform duration-500 group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 text-white max-w-2xl">
              <span className="text-xs font-bold tracking-wider uppercase text-blue-400 block mb-2">
                {t('Featured Research Paper', 'विशेष शोध पत्र')}
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                {language === 'hi' ? (featuredPost.titleHi || featuredPost.title) : featuredPost.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 line-clamp-2">
                {language === 'hi' ? (featuredPost.excerptHi || featuredPost.excerpt) : featuredPost.excerpt}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs">
                <button
                  onClick={() => openPost(featuredPost)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-md transition-colors cursor-pointer"
                >
                  {t('Read Full Paper', 'पूरा लेख पढ़ें')}
                </button>
                <span className="text-slate-400 font-mono">
                  {language === 'hi' ? (featuredPost.readTimeHi || featuredPost.readTime) : featuredPost.readTime}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-6 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pb-2 border-b border-slate-100">
                  <span className="font-bold text-blue-700 uppercase tracking-wider">
                    {language === 'hi' ? (post.categoryHi || post.category) : post.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{language === 'hi' ? (post.readTimeHi || post.readTime) : post.readTime}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                  {language === 'hi' ? (post.titleHi || post.title) : post.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  {language === 'hi' ? (post.excerptHi || post.excerpt) : post.excerpt}
                </p>
              </div>

              <div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">{post.author}</span>
                    <span className="text-[11px] text-slate-500">
                      {language === 'hi' ? (post.authorRoleHi || post.authorRole) : post.authorRole}
                    </span>
                  </div>

                  <button
                    onClick={() => openPost(post)}
                    className="p-2 text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                    title="Read article"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Article Detail Reading Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={closePost}
            aria-hidden="true"
          />

          <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
            <div
              className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 sm:p-10 text-left border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closePost}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                {language === 'hi' ? (selectedPost.categoryHi || selectedPost.category) : selectedPost.category} · {language === 'hi' ? (selectedPost.dateHi || selectedPost.date) : selectedPost.date}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mb-3 leading-snug">
                {language === 'hi' ? (selectedPost.titleHi || selectedPost.title) : selectedPost.title}
              </h2>

              <div className="flex items-center justify-between gap-4 py-3 border-y border-slate-100 mb-6 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-700" />
                  <span className="font-semibold text-slate-900">{selectedPost.author}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>{language === 'hi' ? (selectedPost.authorRoleHi || selectedPost.authorRole) : selectedPost.authorRole}</span>
                </div>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? t('Link Copied', 'कॉपी हो गया') : t('Share', 'शेयर')}</span>
                </button>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
                {(language === 'hi'
                  ? (selectedPost.contentHi?.length ? selectedPost.contentHi : selectedPost.content)
                  : selectedPost.content
                ).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={closePost}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  {t('Close Article', 'लेख बंद करें')}
                </button>
                <span className="text-xs text-slate-400 font-mono">
                  Bhanu Ram Bariha Digital Technologies
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
