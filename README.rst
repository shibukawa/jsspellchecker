JSSpellChecker
==============

This is research project.

* Creates JS tokenizer from JSHint
* Uses tokenizer for spell checking

Now this checker program gethers valid method name from following syntax:

.. code-block:: javascript

   // Style 1
   {
   methodname: function () {}
   }

   // Style 2
   Object.prototype.methodname = function () {};

Any keywords which have paren and dot(.) prefix and don't have new are treated method call.
The result of Levenshtein Distance between valid method names and names used at method call
are 1 to 3, this program reports this result as spell fluctuation.

Author
======

Yoshiki Shibukawa

License
=======

MIT/X License
