import { IMediator, INotification, IObserver, IView } from "../interfaces";
import { Observer } from "../patterns/observer";

/**
 * The <code>View</code> class for PureMVC.
 *
 * A multiton <code>IView</code> implementation.
 *
 * In PureMVC, the <code>View</code> class assumes these responsibilities:
 * <UL>
 * <LI>Maintain a cache of <code>IMediator</code> instances.
 * <LI>Provide methods for registering, retrieving, and removing <code>IMediator</code>s.
 * <LI>Notifiying <code>IMediator</code>s when they are registered or removed.
 * <LI>Managing the <code>Observer</code> lists for each <code>INotification</code> in the
 * application.
 * <LI>Providing a method for attaching <code>IObservers</code> to an
 * <code>INotification</code>'s <code>Observer</code> list.
 * <LI>Providing a method for broadcasting an <code>INotification</code>.
 * <LI>Notifying the <code>IObserver</code>s of a given <code>INotification</code> when it
 * broadcasts.
 */
export class View
	implements IView
{
	/**
	 * Mapping of <code>Mediator</code> names to <code>Mediator</code> instances.
	 *
	 * @protected
	 */
	#mediatorMap:Map<string, IMediator>;

	/**
	 * Mapping of <code>Notification</code> names to <code>Observers</code> lists.
	 *
	 * @protected
	 */
	#observerMap:Map<string, IObserver[]>;
	
	/**
	 * Multiton key for this <code>View</code> instance.
	 *
	 * @protected
	 */
	#multitonKey:string;

	/**
	 * This <code>IView</code> implementation is a multiton, so you should not call the
	 * constructor directly, but instead call the static multiton Factory method
	 * <code>View.getInstance( key )</code>.
	 *
	 * @param key
	 *		Multiton key for this instance of <code>View</code>.
		*
		* @throws Error
		*		Throws an error if an instance for this multiton key has already been constructed.
		*/
	constructor( key:string )
	{
		if (View.instanceMap.has(key))
			throw Error( View.MULTITON_MSG );
			
		View.instanceMap.set(key, this);

		this.#multitonKey = key;
		this.#mediatorMap = new Map();
		this.#observerMap = new Map();

		this.initializeView();
	}

	/**
	 * Initialize the multiton <code>View</code> instance.
	 * 
	 * Called automatically by the constructor. This is the opportunity to initialize the
	 * multiton instance in a subclass without overriding the constructor.
	 */
	public initializeView():void
	{

	}

	/**
	 * Register an <code>IObserver</code> to be notified of <code>INotifications</code> with a
	 * given name.
	 * 
	 * @param notificationName
	 * 		The name of the <code>INotifications</code> to notify this <code>IObserver</code>
	 * 		of.
	 *
	 * @param observer
	 * 		The <code>IObserver</code> to register.
	 */
	public registerObserver( notificationName:string, observer:IObserver ):void
	{
		const observers = this.#observerMap.get(notificationName);

		if (observers)
			observers.push(observer);
		else
			this.#observerMap.set(notificationName,  [observer]);
	}

	/**
	 * Remove a list of <code>IObserver</code>s for a given <code>notifyContext</code> from an
	 * <code>IObserver</code> list for a given <code>INotification</code> name.
	 *
	 * @param notificationName
	 * 		Which <code>IObserver</code> list to remove from.
	 *
	 * @param notifyContext
	 * 		Remove the <code>IObserver</code> with this object as its
	 *		<code>notifyContext</code>.
		*/
	public removeObserver( notificationName:string, notifyContext:any ):void
	{
		//The observer list for the notification under inspection
		const observers = this.#observerMap.get(notificationName);

		if (!observers)
			return

		//Find the observer for the notifyContext.
		let i:number = observers.length;
		
		while( i-- )
		{
			const observer:IObserver = observers[i];

			if (observer.compareNotifyContext(notifyContext))
			{
				observers.splice( i, 1 );
				break;
			}
		}

		/*
			* Also, when a Notification's Observer list length falls to zero, delete the
			* notification key from the observer map.
			*/
		if (observers.length === 0)
			this.#observerMap.delete(notificationName);
	} 

	/**
	 * Notify the <code>IObserver</code>s for a particular <code>INotification</code>.
	 *
	 * All previously attached <code>IObserver</code>s for this <code>INotification</code>'s
	 * list are notified and are passed a reference to the <code>INotification</code> in the
	 * order in which they were registered.
	 * 
	 * @param notification
	 * 		The <code>INotification</code> to notify <code>IObserver</code>s of.
	 */
	public notifyObservers( notification:INotification ): void
	{
		const notificationName:string = notification.getName();

		const observersRef = this.#observerMap.get(notificationName);

		if (observersRef)
		{
			// Copy the array.
			const observers = observersRef.slice(0);
			
			const length = observers.length;

			for (let i = 0; i < length; i++)
			{
				const observer = observers[i];
				observer.notifyObserver(notification);
			}
		}
	}

	/**
	 * Register an <code>IMediator</code> instance with the <code>View</code>.
	 *
	 * Registers the <code>IMediator</code> so that it can be retrieved by name, and further
	 * interrogates the <code>IMediator</code> for its <code>INotification</code> interests.
	 *
	 * If the <code>IMediator</code> returns any <code>INotification</code> names to be
	 * notified about, an <code>Observer</code> is created to encapsulate the
	 * <code>IMediator</code> instance's <code>handleNotification</code> method and register
	 * it as an <code>Observer</code> for all <code>INotification</code>s the
	 * <code>IMediator</code> is interested in.
	 *
	 * @param mediator
	 * 		A reference to an <code>IMediator</code> implementation instance.
	 */
	public registerMediator(mediator:IMediator):void
	{
		const name:string = mediator.getMediatorName();

		//Do not allow re-registration (you must removeMediator first).
		if (this.#mediatorMap.has(name))
			return;

		mediator.initializeNotifier( this.#multitonKey );

		//Register the Mediator for retrieval by name.
		this.#mediatorMap.set(name, mediator);
		
		//Get Notification interests, if any.
		const interests:string[] = mediator.listNotificationInterests();

		if (interests?.length > 0)
		{
			//Create Observer referencing this mediator's handlNotification method.
			const observer:IObserver = new Observer(mediator.handleNotification, mediator);

			//Register Mediator as Observer for its list of Notification interests.
			for (let i = 0;  i < interests.length; i++)
				this.registerObserver( interests[i],  observer);
		}
		
		//Alert the mediator that it has been registered.
		mediator.onRegister();
	}

	/**
	 * Retrieve an <code>IMediator</code> from the <code>View</code>.
	 * 
	 * @param mediatorName
	 * 		The name of the <code>IMediator</code> instance to retrieve.
	 *
	 * @return
	 * 		The <code>IMediator</code> instance previously registered with the given
	 *		<code>mediatorName</code> or an explicit <code>null</code> if it doesn't exists.
		*/
	public retrieveMediator( mediatorName:string ):IMediator | undefined
	{
		//Return a strict null when the mediator doesn't exist
		return this.#mediatorMap.get(mediatorName);
	}

	/**
	 * Remove an <code>IMediator</code> from the <code>View</code>.
	 * 
	 * @param mediatorName
	 * 		Name of the <code>IMediator</code> instance to be removed.
	 *
	 * @return
	 *		The <code>IMediator</code> that was removed from the <code>View</code> or a
		*		strict <code>null</null> if the <code>Mediator</code> didn't exist.
		*/
	public removeMediator( mediatorName:string ):IMediator | undefined
	{
		// Retrieve the named mediator
		const mediator = this.#mediatorMap.get(mediatorName);

		if (!mediator)
			return undefined;

		//Get Notification interests, if any.
		const interests:string[] = mediator.listNotificationInterests();

		//For every notification this mediator is interested in...
		while (interests?.length > 0)
			this.removeObserver(interests.pop()!, mediator);

		// remove the mediator from the map
		this.#mediatorMap.delete(mediatorName);

		//Alert the mediator that it has been removed
		mediator.onRemove();

		return mediator;
	}
	
	/**
	 * Check if a <code>IMediator</code> is registered or not.
	 * 
	 * @param mediatorName
	 * 		The <code>IMediator</code> name to check whether it is registered.
	 *
	 * @return
	 *		An <code>IMediator</code> is registered with the given <code>mediatorName</code>.
		*/
	public hasMediator( mediatorName:string ):boolean
	{
		return this.#mediatorMap.has(mediatorName);
	}


	/**
	 * Error message used to indicate that a <code>View</code> singleton instance is
	 * already constructed for this multiton key.
	 *
	 * @constant
	 * @protected
	 */
	protected static MULTITON_MSG:string = "View instance for this multiton key already constructed!";

	/**
	 * <code>View</code> singleton instance map.
	 *
	 * @protected
	 */
	protected static instanceMap:Map<string, IView> = new Map();

	/**
	 * <code>View</code> multiton factory method.
	 *
	 * @param key
	 *		The multiton key of the instance of <code>View</code> to create or retrieve.
	 *
	 * @return
	 *		The singleton instance of <code>View</code>.
	 */
	public static getInstance(key:string):IView
	{
		if (!View.instanceMap.has(key))
			View.instanceMap.set(key, new View(key));

		return View.instanceMap.get(key)!;
	}

	/**
	 * Remove a <code>View</code> instance.
	 *
	 * @param key
	 * 		Key identifier of <code>View</code> instance to remove.
	 */
	public static removeView(key:string):void
	{
		View.instanceMap.delete(key);
	}
}