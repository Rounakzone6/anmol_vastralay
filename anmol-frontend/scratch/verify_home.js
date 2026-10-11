async function check() {
  const res = await fetch('http://localhost:3000');
  const html = await res.text();
  const imgMatches = html.match(/<img[^>]+src="([^">]+)"/g) || [];
  console.log('Total <img> tags:', imgMatches.length);
  const sources = imgMatches.map(tag => {
    const m = tag.match(/src="([^">]+)"/);
    return m ? decodeURIComponent(m[1]) : '';
  });
  console.log('Sample images rendered in <img>:');
  console.log([...new Set(sources)].slice(0, 20));
}
check().catch(console.error);
