#Simple use of JSV_API

##Run the demo
In order to run this demo, just open this file in your favorite browser

##What does it do ?

In this demo, we show you :
* How to define rules
* How to create a validator
* How to trigger the validation process. In this case, the validation is triggered :
 * when the form is submitted
 * when you release a key ('keyup') in the 'age' field
 
## Important things to notice

This validation API provides a way to validate fields whenever an event occur to them, and to validate fields when an
event occurs to other fields. For instance, we configured 2 things here :
* validate the 'age' fields when the 'keyup' event is triggered on itself
* validate each field in the form when you submit the form

Of course, regardless the validation method you choose, each field will be validated with the rules that apply to it.
