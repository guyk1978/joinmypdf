export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  
  // אם הנתיב חסר סיומת ואינו קובץ סטטי (כמו CSS/JS/תמונה)
  if (!url.pathname.match(/\.[a-zA-Z0-9]+$/) && !url.pathname.endsWith('/')) {
    // ננסה להביא את קובץ ה-html המתאים ש-Next.js ייצר
    const htmlUrl = new URL(`${url.pathname}.html`, request.url);
    const response = await context.env.ASSETS.fetch(htmlUrl);
    if (response.status === 200) {
      return response;
    }
  }
  
  return next();
};
