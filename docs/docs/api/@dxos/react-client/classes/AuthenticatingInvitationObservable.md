# Class `AuthenticatingInvitationObservable`
<sub>Declared in [packages/sdk/client/dist/types/src/packlets/invitations/invitations.d.ts:21]()</sub>


Cancelable observer that relays authentication requests.


## Constructors
### [constructor(options)]()



Returns: <code>[AuthenticatingInvitationObservable](/api/@dxos/react-client/classes/AuthenticatingInvitationObservable)</code>

Arguments: 

`options`: <code>object</code>


## Properties


## Methods
### [\[observable\]()]()



Returns: <code>Observable&lt;[Invitation](/api/@dxos/react-client/interfaces/Invitation)&gt;</code>

Arguments: none

### [authenticate(authCode)]()



Returns: <code>Promise&lt;void&gt;</code>

Arguments: 

`authCode`: <code>string</code>

### [cancel()]()



Returns: <code>Promise&lt;void&gt;</code>

Arguments: none

### [concat(observable)]()



Returns: <code>Observable&lt;R&gt;</code>

Arguments: 

`observable`: <code>Observable&lt;R&gt;[]</code>

### [filter(callback)]()



Returns: <code>Observable&lt;[Invitation](/api/@dxos/react-client/interfaces/Invitation)&gt;</code>

Arguments: 

`callback`: <code>function</code>

### [flatMap(callback)]()



Returns: <code>Observable&lt;R&gt;</code>

Arguments: 

`callback`: <code>function</code>

### [forEach(callback)]()



Returns: <code>Promise&lt;void&gt;</code>

Arguments: 

`callback`: <code>function</code>

### [get()]()



Get the current value of the observable.


Returns: <code>[Invitation](/api/@dxos/react-client/interfaces/Invitation)</code>

Arguments: none

### [map(callback)]()



Returns: <code>Observable&lt;R&gt;</code>

Arguments: 

`callback`: <code>function</code>

### [reduce(callback, \[initialValue\])]()



Returns: <code>Observable&lt;R&gt;</code>

Arguments: 

`callback`: <code>function</code>

`initialValue`: <code>R</code>

### [subscribe(onNext, \[onError\], \[onComplete\])]()



Returns: <code>Subscription</code>

Arguments: 

`onNext`: <code>function</code>

`onError`: <code>function</code>

`onComplete`: <code>function</code>

### [empty()]()



Returns: <code>MulticastObservable&lt;"null"&gt;</code>

Arguments: none

### [from(value, \[initialValue\])]()



Returns: <code>MulticastObservable&lt;T&gt;</code>

Arguments: 

`value`: <code>Observable&lt;T&gt; | ObservableLike&lt;T&gt; | ArrayLike&lt;T&gt; | Event&lt;T&gt;</code>

`initialValue`: <code>T</code>

### [of(items)]()



Returns: <code>MulticastObservable&lt;T&gt;</code>

Arguments: 

`items`: <code>T[]</code>