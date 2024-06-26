/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import vuelve from '../src/index.ts'

describe('vuelve', () => {
  it('handles props correctly', async () => {
    const composable = vuelve({
      props: ['title'],
      data() {
        return { count: 0 }
      },
      computed: {
        titleWithCount() {
          return `${this.title} ${this.count.value}`
        },
      },
    })

    const component = defineComponent({
      props: {
        title: String,
      },
      setup(props) {
        const { titleWithCount } = composable({
          title: props.title,
        })
        return { titleWithCount }
      },
      template: '<div>{{ titleWithCount }}</div>',
    })

    const wrapper = mount(component, {
      props: {
        title: 'Count:',
      },
    })

    expect(wrapper.text()).toContain('Count: 0')
  })

  it('implements computed properties', async () => {
    const composable = vuelve({
      data() {
        return { count: 0 }
      },
      computed: {
        doubled() {
          return this.count.value * 2
        },
      },
    })

    const component = defineComponent({
      setup() {
        const { doubled } = composable()
        return { doubled }
      },
      template: '<div>{{ doubled }}</div>',
    })

    const wrapper = mount(component)
    expect(wrapper.text()).toContain('0')
  })

  it('calls mounted and unmounted lifecycle hooks', async () => {
    const mountedSpy = jest.fn()
    const unmountedSpy = jest.fn()

    const composable = vuelve({
      mounted() {
        mountedSpy()
      },
      unmounted() {
        unmountedSpy()
      },
    })

    const component = defineComponent({
      setup() {
        return composable()
      },
      template: '<div></div>',
    })

    const wrapper = mount(component)
    expect(mountedSpy).toHaveBeenCalled()
    wrapper.unmount()
    expect(unmountedSpy).toHaveBeenCalled()
  })

  it('calls beforeUpdate and updated lifecycle hooks', async () => {
    const beforeUpdateSpy = jest.fn()
    const updatedSpy = jest.fn()

    const composable = vuelve({
      data() {
        return { count: 0 }
      },
      methods: {
        increment() {
          this.count.value += 1
        },
      },
      beforeUpdate() {
        beforeUpdateSpy()
      },
      updated() {
        updatedSpy()
      },
    })

    const component = defineComponent({
      setup() {
        const { count, increment } = composable()
        return { count, increment } as Record<string, any>
      },
      template: '{{ count }} <button @click="increment"></button>',
    })

    const wrapper = mount(component)

    await nextTick()
    wrapper.find('button').trigger('click')
    await nextTick()

    expect(beforeUpdateSpy).toHaveBeenCalled()
    expect(updatedSpy).toHaveBeenCalled()
  })

  it('tracks reactivity with watch and watchEffect', async () => {
    const watchSpy = jest.fn()
    const watchEffectSpy = jest.fn()

    const composable = vuelve({
      data() {
        return { count: 0 }
      },
      methods: {
        increment() {
          this.count.value += 1
        },
      },
      watch: {
        count(newValue) {
          watchSpy(newValue)
        },
      },
      watchEffect: {
        watchEffectSpy() {
          watchEffectSpy(this.count.value)
        },
      },
    })

    const component = defineComponent({
      setup() {
        const { count, increment } = composable()
        return { count, increment } as Record<string, any>
      },
      template: '<div>{{ count }}</div><button @click="increment"></button>',
    })

    const wrapper = mount(component)

    wrapper.find('button').trigger('click')

    await nextTick()
    expect(watchSpy).toHaveBeenCalledWith(1)
    expect(watchEffectSpy).toHaveBeenCalledWith(1)
  })

  it('calls renderTriggered and renderTracked lifecycle hooks', async () => {
    const renderTriggeredSpy = jest.fn()
    const renderTrackedSpy = jest.fn()

    const composable = vuelve({
      data() {
        return { count: 0 }
      },
      methods: {
        increment() {
          this.count.value += 1
        },
      },
      renderTriggered() {
        renderTriggeredSpy()
      },
      renderTracked() {
        renderTrackedSpy()
      },
    })

    const component = defineComponent({
      setup() {
        const { count, increment } = composable()
        return { count, increment } as Record<string, any>
      },
      template: '<div>{{ count }} <button @click="increment"></button></div>',
    })

    const wrapper = mount(component)

    wrapper.find('button').trigger('click')

    await nextTick()
    expect(renderTriggeredSpy).toHaveBeenCalled()
    expect(renderTrackedSpy).toHaveBeenCalled()
  })

  it('throws an error when props are of incorrect type', async () => {
    const composable = vuelve({
      props: {
        title: String,
      },
      data() {
        return { count: 0 }
      },
      computed: {
        titleWithCount() {
          return `${this.title} ${this.count.value}`
        },
      },
    })

    expect(() =>
      composable({
        title: 1,
      })
    ).toThrow(new TypeError('Invalid prop: type check failed for prop "title". Expected String, got Number'))
  })
  it('throws an error when prop of incorrect type is provided', async () => {
    const composable = vuelve({
      props: {
        title: {
          type: String,
          required: true,
        },
      },
      data() {
        return { count: 0 }
      },
      computed: {
        titleWithCount() {
          return `${this.title} ${this.count.value}`
        },
      },
    })

    expect(() =>
      composable({
        title: 1,
      })
    ).toThrow(new TypeError('Invalid prop: type check failed for prop "title". Expected String, got Number'))
  })

  it('throws an error when required prop is not provided', async () => {
    const composable = vuelve({
      props: {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
      data() {
        return { count: 0 }
      },
      computed: {
        titleWithCount() {
          return `${this.title} ${this.count.value}`
        },
      },
    })

    expect(() =>
      composable({
        title: 'new title',
      })
    ).toThrow(new Error('description is required but not provided.'))
  })
  it('successfully handles prop of correct type with dynamic value', async () => {
    const composable = vuelve({
      props: {
        title: {
          type: true,
        },
      },
      data() {
        return { count: 0 }
      },
      computed: {
        titleWithCount() {
          return `${this.title} ${this.count.value}`
        },
      },
    })

    const component = defineComponent({
      props: {
        title: String,
      },
      setup(props) {
        const { titleWithCount } = composable({
          title: props.title,
        })
        return { titleWithCount }
      },
      template: '<div>{{ titleWithCount }}</div>',
    })

    const wrapper = mount(component, {
      props: {
        title: 'Count:',
      },
    })

    expect(wrapper.text()).toContain('Count: 0')
  })
  it('successfully handles props with default values', async () => {
    const composable = vuelve({
      props: {
        title: {
          type: String,
          required: false,
          default: () => 'Count',
        },
        secondTitle: {
          type: String,
          required: false,
          default: 'Click:',
        },
      },
      data() {
        return { count: 0 }
      },
      computed: {
        titleWithCount() {
          return `${this.title} and ${this.secondTitle} ${this.count.value}`
        },
      },
    })

    const component = defineComponent({
      setup() {
        const { titleWithCount } = composable()
        return { titleWithCount }
      },
      template: '<div>{{ titleWithCount }}</div>',
    })

    const wrapper = mount(component)

    expect(wrapper.text()).toContain('Count and Click: 0')
  })

  it('successfully handles props of correct type', async () => {
    const composable = vuelve({
      props: {
        title: String,
      },
      data() {
        return { count: 0 }
      },
      computed: {
        titleWithCount() {
          return `${this.title} ${this.count.value}`
        },
      },
    })

    const component = defineComponent({
      props: {
        title: String,
      },
      setup(props) {
        const { titleWithCount } = composable({
          title: props.title,
        })
        return { titleWithCount }
      },
      template: '<div>{{ titleWithCount }}</div>',
    })

    const wrapper = mount(component, {
      props: {
        title: 'Count:',
      },
    })

    expect(wrapper.text()).toContain('Count: 0')
  })

  it('handles object data value correctly', async () => {
    const composable = vuelve({
      data() {
        return {
          count: {
            title: 'Count:',
            value: 0,
          },
        }
      },
      methods: {
        increment() {
          this.count.value += 1
        },
      },
    })

    const component = defineComponent({
      setup() {
        const { count, increment } = composable()
        return { count, increment } as Record<string, any>
      },
      template: '<div>{{ count.title }} {{ count.value }} <button @click="increment"></button></div>',
    })

    const wrapper = mount(component)

    wrapper.find('button').trigger('click')

    await nextTick()

    expect(wrapper.text()).toContain('Count: 1')
  })
})
