JSSpellChecker
==============

This is research project.

* Creates JS tokenizer from JSHint
* Uses tokenizer for spell checking

Now this checker program gethers valid method name from following syntax::

   // Style 1
   {
   methodname: function () {}
   }

   // Style 2
   Object.prototype.methodname = function () {};

Any keywords which have paren and dot(.) prefix and don't have new are treated method call.
The result of Levenshtein Distance between valid method names and names used at method call
are 1 to 3, this program reports this result as spell fluctuation.

Usage
=====

Run ``checker.js`` with node.js::

   $ node checker.js testdata/ng.js 
   varidMethod (line 9)
       -> 1: validMethod (line 2)
   destory (line 10)
       -> 1: destroy (ngCore)
   settext (line 11)
       -> 1: setText (ngCore)
   text (line 12)
       -> 1: test (line 7)

Author
======

Yoshiki Shibukawa (shibukawa.yoshiki at dena.jp / yshibukawa at ngmoco.com)

License
=======

This is released under MIT/X License

It uses customized JSHint as JavaScript tokenizer. It is created by JSHint team under MIT License.

`opts.js <https://bitbucket.org/mazzarelli/js-opts/downloads>`_ is created by Joey Mazzarelli under Simpified BSD License.
