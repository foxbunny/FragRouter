build:
	uglifyjs frag.js > frag-`grep @version frag.js | sed 's/ \* @version //'`.min.js
